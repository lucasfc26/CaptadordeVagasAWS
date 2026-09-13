"""Valida a coleta quando a Amazon mostra só 1 jobCard no shadow DOM."""

from pathlib import Path

from amazon_warehouse import (
    _count_job_cards,
    _jobs_from_single_card,
    _normalize_salary,
    _parse_card_text,
    _parse_location,
    _scrape_cards,
    _scrape_single_job,
    _visible_result_count,
)
from camoufox.sync_api import Camoufox
from trawl_browser import attach_trawl_init_script

FIXTURE = Path(__file__).with_name("fixtures") / "one_job_card.html"
CARD_TEXT = """
Fulfillment Center Warehouse Associate
1 shift available
Type: Part time
Duration: Regular
Pay rate: Up to $22.00
Within 18.0 mi | Brisbane, CA
"""


def test_parse_single_card_text() -> None:
    parsed = _parse_card_text(CARD_TEXT)
    city, state = _parse_location("Within 18.0 mi | Brisbane, CA")
    job = _jobs_from_single_card(CARD_TEXT, "JOB-US-0000018326")[0]
    assert parsed["jobType"].lower().startswith("part")
    assert parsed["schedule"].lower() == "regular"
    assert parsed["salary"] == "$22.00"
    assert city == "Brisbane" and state == "CA"
    assert job["url"].endswith("jobId=JOB-US-0000018326&locale=en-US")


def test_pay_from_job_detail_text_div() -> None:
    stencil = "<strong>Pay rate:</strong> Up to $21.25"
    assert _normalize_salary(stencil) == "$21.25"
    parsed = _parse_card_text(
        "Warehouse Equipment Operator\nPay rate:\nUp to $21.25\nShippensburg, PA"
    )
    assert parsed["salary"] == "$21.25"


def test_parse_job_detail_text() -> None:
    detail = """
    Fulfillment Center Warehouse Associate
    JOB-US-0000018379
    Pay rate Up to $21.90
    7601 Metro Air Parkway, Sacramento, CA 95837
    Type
    Full Time, Part Time
    Duration
    Regular
    Language
    English
    """
    parsed = _parse_card_text(detail)
    city, state = _parse_location(parsed["location"])
    assert parsed["salary"] == "$21.90"
    assert parsed["schedule"] == "Regular"
    assert "Full Time" in parsed["jobType"]
    assert parsed["location"].startswith("7601 Metro Air Parkway")
    assert city == "Sacramento" and state == "CA"


def test_scrape_closed_shadow_card() -> None:
    with Camoufox(headless=True) as browser:
        page = browser.new_page()
        attach_trawl_init_script(page)
        page.goto(FIXTURE.resolve().as_uri())
        page.wait_for_timeout(400)
        assert _visible_result_count(page) == 1
        assert _count_job_cards(page) >= 1
        jobs = _scrape_single_job(page) or _scrape_cards(page)
        assert len(jobs) == 1
        assert jobs[0]["externalId"] == "JOB-US-0000018326"
        assert "Warehouse Equipment Operator" in jobs[0]["title"]
        assert jobs[0]["city"] == "Shippensburg"
        assert jobs[0]["salary"] == "$21.25"
        page.close()


if __name__ == "__main__":
    test_parse_single_card_text()
    test_pay_from_job_detail_text_div()
    test_parse_job_detail_text()
    test_scrape_closed_shadow_card()
    print("ok: 1 jobCard no shadow fechado")
