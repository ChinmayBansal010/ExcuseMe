# Manual QA matrix

Use this matrix after changing UI, networking, or model behavior. Record actual results rather than assuming a scenario passed.

| Scenario | Expected behavior |
|---|---|
| Fresh launch | App opens with the light theme |
| Theme toggle | Switches themes without losing input |
| Empty text | Clear validation message; no API request |
| Whitespace-only text | Rejected as empty |
| 20,000-character text | Accepted by client-side length validation |
| Over-limit text | Rejected before submission |
| API unavailable | Connection error explains how to check the API URL |
| Backend validation error | User sees a readable message |
| Analysis in progress | Loading skeleton and progress text are visible |
| Analysis success | Results correspond to selected operations |
| Analysis failure | Loading ends and input remains available |
| Compare with one empty side | Clear validation message |
| Long result | Scrolling works without clipping |
| Theme change after results | Result cards remain readable |
| Share result | Shared payload contains result and limitation notice |
| Small viewport | Inputs and actions remain reachable |
