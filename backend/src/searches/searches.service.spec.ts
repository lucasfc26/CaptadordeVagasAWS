import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MonitoringQueueService } from '../queues/monitoring-queue.service';
import { SearchesService } from './searches.service';

describe('SearchesService', () => {
  let service: SearchesService;
  let prisma: {
    search: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    job: { count: jest.Mock };
  };
  let monitoringQueue: { scheduleSearch: jest.Mock; cancelSearch: jest.Mock };

  const otherUsersSearch = {
    id: 'search-1',
    userId: 'owner-id',
    status: SearchStatus.ACTIVE,
    keywords: [],
    locations: [{ city: 'Richmond', state: 'CA', isPrimary: true }],
  };

  beforeEach(async () => {
    prisma = {
      search: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      job: { count: jest.fn().mockResolvedValue(0) },
    };
    monitoringQueue = {
      scheduleSearch: jest.fn().mockResolvedValue(undefined),
      cancelSearch: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MonitoringQueueService, useValue: monitoringQueue },
      ],
    }).compile();

    service = moduleRef.get(SearchesService);
  });

  describe('ownership', () => {
    it('throws NotFoundException when the search belongs to another user', async () => {
      prisma.search.findUnique.mockResolvedValue(otherUsersSearch);

      await expect(service.findOneForUser('someone-else', 'search-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the search does not exist', async () => {
      prisma.search.findUnique.mockResolvedValue(null);

      await expect(service.pause('owner-id', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the search when the requesting user is the owner', async () => {
      prisma.search.findUnique.mockResolvedValue(otherUsersSearch);

      const result = await service.findOneForUser('owner-id', 'search-1');
      expect(result.id).toBe('search-1');
    });
  });

  describe('pause / resume', () => {
    it('cancels the queued job and clears nextCheckAt when pausing', async () => {
      prisma.search.findUnique.mockResolvedValue(otherUsersSearch);
      prisma.search.update.mockResolvedValue({
        ...otherUsersSearch,
        status: SearchStatus.PAUSED,
        nextCheckAt: null,
      });

      await service.pause('owner-id', 'search-1');

      expect(prisma.search.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SearchStatus.PAUSED, nextCheckAt: null }),
        }),
      );
      expect(monitoringQueue.cancelSearch).toHaveBeenCalledWith('search-1');
    });

    it('schedules an immediate run when resuming', async () => {
      prisma.search.findUnique.mockResolvedValue(otherUsersSearch);
      prisma.search.update.mockResolvedValue({ ...otherUsersSearch, status: SearchStatus.ACTIVE });

      await service.resume('owner-id', 'search-1');

      expect(monitoringQueue.scheduleSearch).toHaveBeenCalledWith('search-1', 0);
    });
  });

  describe('remove', () => {
    it('cancels the queued job before deleting', async () => {
      prisma.search.findUnique.mockResolvedValue(otherUsersSearch);

      await service.remove('owner-id', 'search-1');

      expect(monitoringQueue.cancelSearch).toHaveBeenCalledWith('search-1');
      expect(prisma.search.delete).toHaveBeenCalledWith({ where: { id: 'search-1' } });
    });
  });
});
