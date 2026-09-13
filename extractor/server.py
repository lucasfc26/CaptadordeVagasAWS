from __future__ import annotations

import threading
import traceback
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from amazon_warehouse import run_amazon_warehouse_search

app = FastAPI(title="JobWatch Warehouse Extractor")
_lock = threading.Lock()


class ExtractRequest(BaseModel):
    zipCode: str = Field(min_length=2, max_length=120)
    workHours: int | None = None
    schedule: list[str] = Field(default_factory=list)
    length: str | None = None
    whenStart: str | None = None
    jobTitle: str | None = None
    employmentType: str | None = None
    payRateMin: int | None = None
    payRateMax: int | None = None


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/extract")
def extract(body: ExtractRequest) -> dict[str, Any]:
    if not _lock.acquire(blocking=True, timeout=240):
        raise HTTPException(status_code=429, detail="O extrator já está em uma varredura")
    try:
        jobs = run_amazon_warehouse_search(body.model_dump())
        return {"jobs": jobs}
    except HTTPException:
        raise
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=str(error)) from error
    finally:
        _lock.release()
