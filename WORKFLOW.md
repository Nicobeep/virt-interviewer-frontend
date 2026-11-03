# Workflow: PubMed Reading List Builder and Research Planner

This project has two parts. The **web page** (`index.html`) searches PubMed and exports references. The **agent pipeline** (`research_planner/`) drafts a literature list and an IRB application from study details. Use them together or separately.

Copyright (c) 2026 Nicole Cheng. Licensed under the MIT License.

---

## Part 1: Web page (`index.html`)

No server, no build step, no install. It runs in any modern browser.

### Setup (once)
1. Keep `index.html` in one folder.
2. Open it in a browser (double-click the file).
3. Optional: get a free Google Gemini key at aistudio.google.com for the query helper. Anthropic Claude also works if you have a key.

### Steps
1. **Describe the topic (optional).** In the *Query helper* box, type your question in plain language and click **Suggest query**.
   - Ask the helper to refine the query by replying in the same chat.
   - Click **Use in search box** to copy a suggested query into the search form.
2. **Check the query.** Click **Check query** (no AI needed). The page reports:
   - how many results PubMed returns,
   - whether each MeSH term exists (red means not found; check the spelling in the MeSH Browser),
   - how PubMed interpreted the query.
3. **Set filters.** Optionally set a year range, article types, sort order and maximum results.
4. **Search.** Click **Search PubMed**. Results show title, authors, journal, year, article type, abstract and links.
5. **Select.** Untick any articles you don't want. Use **Select all** or **Clear** to change everything at once.
6. **Export.**
   - **Export RIS** for EndNote, Zotero or Mendeley.
   - **Export CSV** for Excel or Google Sheets.
   - **Copy citations** for a plain numbered list.
7. **Verify.** Open each PubMed or DOI link and check the citation before you use it.

### Rules
- Do not enter patient data or protected health information anywhere on the page.
- Search terms, and anything typed in the query helper, go to NCBI PubMed and, if you use the helper, to your chosen AI provider.
- Don't save an API key on a shared computer. The **Remember the key** box is off by default.
- AI-suggested queries are starting points. Check them yourself, and have a health sciences librarian review any search you report.

---

## Part 2: Agent pipeline (`research_planner/`)

Requires Python, `google-adk`, `litellm` and `requests`. See `research_planner/README.md` for full setup.

### Setup (once)
1. Create `research_planner/.env` with your keys (Anthropic or Gemini, plus optional SerpAPI and NCBI keys).
2. Put your institution's IRB template in `research_planner/irb_template.md`.
3. From the parent folder, run `adk web`.

### Steps
1. **Start a session** in the ADK web UI and select `research_planner`.
2. **Provide study details** when the coordinator asks: title, research question, population, methods, risks and benefits, and search keywords. Missing details are fine; the agents mark them.
3. **Parallel work:**
   - `data_collector` searches PubMed and Google Scholar, de-duplicates, and writes `outputs/reading_list.md`.
   - `irb_drafter` fills the template and writes `outputs/irb_draft.md`, marking every gap as `[NEEDS INPUT]`.
4. **Compile.** The `compiler` agent summarizes both outputs and lists open items.
5. **Review outputs** in `research_planner/outputs/`. Check every citation, the year and the author list before use.
6. **Resolve `[NEEDS INPUT]` items** with a clinician, coder, biostatistician or the IRB office, not by accepting the draft.
7. **Update the search** if needed: export the reading list to the web page's RIS format or to EndNote/Zotero, then run new searches on the page.

### Rules
- The IRB draft is a starting point. The IRB office and study team must review it.
- Keep `.env` out of version control and never share it.
- Check model quotas before long runs (free tiers have daily limits).

---

## Combined workflow (suggested)

1. **Scope the question** with the query helper on the web page.
2. **Build the search** and check it against PubMed.
3. **Run the agent pipeline** with the same study details to draft the IRB and reading list.
4. **Compare** the agent's reading list with your PubMed export. Keep only what you verified.
5. **Import** the verified references into EndNote or Zotero.
6. **Finalize** the IRB draft with your team and submit through the institution's process.

## Checklist before using any output

- [ ] Every citation opened and checked against PubMed or the DOI
- [ ] No patient data or restricted content sent to any tool
- [ ] All `[NEEDS INPUT]` items resolved or marked NA
- [ ] Clinical and statistical choices reviewed by the right people
- [ ] Institution's IRB and data-security requirements confirmed
