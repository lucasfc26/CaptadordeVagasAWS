from pathlib import Path

from camoufox.sync_api import Camoufox
from trawl_browser import attach_trawl_init_script
from amazon_warehouse import _count_job_cards, _visible_result_count

FIXTURE = Path("/app/fixtures/one_job_card.html")

with Camoufox(headless=True) as browser:
    page = browser.new_page()
    attach_trawl_init_script(page)
    page.goto(FIXTURE.resolve().as_uri())
    page.wait_for_timeout(500)
    print("URL", page.url)
    print("TITLE", page.title())
    print("TEXT", page.inner_text("body")[:400])
    print("VISIBLE", _visible_result_count(page))
    for selector in ('[data-test-id="jobCard"]', '[data-test-id="jobSearchResultItem"]'):
        print("LOC", selector, page.locator(selector).count())
    print(
        "EVAL",
        page.evaluate(
            """() => {
              let count = 0;
              let hosts = 0;
              const walk = (root) => {
                count += root.querySelectorAll('[data-test-id="jobCard"], [data-test-id="jobSearchResultItem"]').length;
                for (const el of root.querySelectorAll('*')) {
                  if (el.shadowRootUnl) hosts += 1;
                  const next = el.shadowRoot || el.shadowRootUnl;
                  if (next) walk(next);
                }
              };
              walk(document);
              return { count, hosts, html: document.body.innerHTML.slice(0, 300) };
            }"""
        ),
    )
    print("COUNT", _count_job_cards(page))
    page.close()
