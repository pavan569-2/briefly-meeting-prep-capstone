# Briefly Capstone Retrospective

## How the Plan Changed During Execution

During execution, I discovered that some functionality was technically working, but not always in the way I intended it to work. This meant I sometimes had to go back to functionality that appeared to work, understand the discrepancy, and tweak or refine it so that the implementation behaved in the intended way rather than merely appearing functional. For instance, the React Router navigation worked seamlessly on the client side, but directly loading routes like `/dashboard` threw a 404 in production until I explicitly configured the Vercel deployment rewrite rules. I had to iteratively refine the deployment configuration to ensure the application behaved correctly across all access patterns, rather than settling for what worked locally.

## The Hardest Part

Debugging was the hardest part. The challenge was not simply fixing errors, but determining the actual root cause when something did not behave as expected. It is easy to apply superficial patches that mask a symptom, but tracing back to the structural origin of an issue requires far more patience and deep architectural understanding. I had to learn to step back, diagnose the core structural flaw, and plan a controlled fix before executing code changes.

## A Failure That Stands Out

The narrow-window / responsive scrolling issue stands out particularly clearly. At reduced browser widths, scrolling failed entirely for core meeting workflows. I investigated several plausible lower-level Flexbox fixes before I traced the complete height chain. The final issue was an intermediate flex child in `DashboardPage.tsx` that lacked `min-h-0`. The final correction bounded the complete vertical height chain and restored scrolling for Saved Brief, New Meeting, and Start Follow-up. The important personal lesson from this incident is that debugging required identifying the actual root cause rather than repeatedly treating symptoms.

## What I Would Build Differently

I do not think I would materially change anything if I started the build again. The workflow I eventually settled on was good and productive. The workflow that proved productive was the broader structured process of planning, implementation, review, validation, and correction. The important point is that I did not simply accept functionality once it appeared to work. I reviewed and validated it, and went back to correct or refine it where necessary. This workflow helped me keep the work structured, controlled, and thorough. Therefore, I would largely use the same workflow again because it proved effective and reliable.

## What I Am Most Proud Of

I am proud not only of the finished product, but particularly of the rigor that went into making sure it was completed the right way and thoroughly. A major part of that was reviewing, validating, correcting, testing, and checking the implementation instead of stopping as soon as the application appeared to work. The fact that the project includes a robust automated test suite with 97 passing tests, a dedicated security review, comprehensive API documentation, and thorough production deployment validation stands as evidence of this rigor. The testing, security review, documentation, and production validation gave me greater confidence in the quality of the final implementation.

## Lessons Learned

Reflecting on the capstone project, several meaningful lessons stand out:
- **Validation:** Functionality that appears to work still needs to be validated against the intended behaviour. Superficial functionality is not the same as structural correctness.
- **Debugging approach:** Root-cause debugging is more effective than repeatedly treating symptoms. Tracing issues to their origin saves time and technical debt in the long run.
- **Discipline:** Structured planning, review, validation, and correction reduce the chance of accepting superficially working implementations.
- **Production environments:** Production deployment testing can expose issues, such as environment routing anomalies, that do not appear during normal local development.
- **Responsive design:** Responsive testing should include reduced viewport sizes rather than relying only on a full-size desktop browser.
- **Quality assurance:** Automated testing, accurate documentation, and rigorous security reviews contribute deeply to my confidence in the final implementation.
- **Process ownership:** A disciplined AI-assisted workflow still requires my active human review, validation, and ownership of the final decisions.
