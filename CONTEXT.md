# Agent

Agent manages automation runs for carrier and clinic workflows, with a strong focus on observing each run as it moves through its lifecycle.

## Language

**Execution**:
One run of an automation workflow for a specific carrier, bot, and input set.
_Avoid_: Job, run item, process row

**Scheduled Execution**:
An **Execution** that was created with a parseable scheduled start time recorded in `scheduledAt`.
_Avoid_: Scheduled status, scheduled row, scheduled lifecycle state

**Waiting Scheduled Execution**:
A **Scheduled Execution** whose scheduled start time is still in the future.
_Avoid_: Scheduled status, pending schedule status

**Client**:
The customer or practice organization that owns one or more clinics and can be associated with an **Execution**.
_Avoid_: Customer, account

**Execution Status**:
The canonical lifecycle state of an **Execution**, which must be represented consistently everywhere in the UI.
_Avoid_: Local status, sidebar status, detail status

**Execution Control Request**:
A user command that asks the system to change an **Execution**, such as pause, resume, or stop.
_Avoid_: Status change, confirmed status

**Execution Status Read Model**:
The shared client-side representation of confirmed **Execution Status** that every execution view reads from.
_Avoid_: View-local status state, detail-only status, sidebar-only status

**Execution Report**:
A Playwright HTML test report produced for an **Execution** and served by that execution target under `/reports/<execution-id>/index.html`.
_Avoid_: Report artifact, test output, iframe report

**Playwright Project**:
A named automation project that can group **Executions** and can be associated with one or more bots.
_Avoid_: Suite, script set

**Playwright Runtime**:
A named automation runtime definition that describes the application endpoints available to Playwright-driven automation.
_Avoid_: Environment, host set

**Playwright Runtime Application**:
One application entry exposed by a **Playwright Runtime**, including its name and optional API URL.
_Avoid_: Service, integration target

**Selected Playwright Runtime Application**:
The **Playwright Runtime Application** chosen by the user for the current dashboard URL, which determines which execution API the dashboard uses.
_Avoid_: Global runtime preference, environment switcher

**Selected Execution Target URL**:
The API URL recorded with the **Selected Playwright Runtime Application** for the current dashboard URL.
_Avoid_: Default execution API, fallback app URL

**Default Carrier API**:
The dashboard's built-in carrier API target used for authentication, customer data, clinic data, and Playwright catalog discovery.
_Avoid_: Execution API, selected app API

## Relationships

- An **Execution** has exactly one current **Execution Status**
- `scheduled` is not an **Execution Status**; waiting is derived from `scheduledAt`
- Legacy execution payloads may use `scheduled` to mean queued lifecycle state with `scheduledAt`
- A **Scheduled Execution** is identified by its scheduled start time, not by its **Execution Status**
- A **Scheduled Execution** remains a **Scheduled Execution** after it starts or finishes
- A **Scheduled Execution** is considered waiting until the current time reaches its scheduled start time
- Waiting **Scheduled Executions** present time remaining until their scheduled start time; started **Scheduled Executions** present elapsed time like other **Executions**
- A waiting **Scheduled Execution** presents natural remaining time until the final minute, then presents a clock-style countdown
- In the sidebar, a **Scheduled Execution** appears only in the scheduled section and not in the normal execution section
- An **Execution** is associated with one **Client**
- An **Execution** can reference one **Playwright Project**
- A **Client** can own many clinics
- An **Execution** can receive many **Execution Control Requests** over its lifetime
- A **Playwright Project** can be associated with many bots
- A **Playwright Runtime** can expose many **Playwright Runtime Applications**
- A **Selected Playwright Runtime Application** belongs to one **Playwright Runtime**
- A **Selected Playwright Runtime Application** has one **Selected Execution Target URL**
- Execution API requests use the **Selected Execution Target URL**
- Execution API requests require a **Selected Playwright Runtime Application**
- Execution realtime subscriptions follow the same execution target as execution API requests
- Execution reports follow the same execution target as execution API requests
- The **Default Carrier API** provides the catalog of available **Playwright Runtimes**
- The **Default Carrier API** provides the catalog of available **Playwright Projects**
- The sidebar, execution list, and detail page all present the same **Execution Status** for a given **Execution**
- An **Execution Control Request** does not change **Execution Status** by itself; the status changes only when the lifecycle update is confirmed by the system
- The sidebar, execution list, and detail page all read confirmed status from the same **Execution Status Read Model**
- The **Execution Status Read Model** is maintained independently of any single execution view
- The home overview may present HTTP snapshot status and is not an **Execution Status Read Model** consumer
- Websocket status events are the authoritative live transition feed for **Execution Status**
- HTTP execution payloads may repair the **Execution Status Read Model** when websocket events were missed
- When confirmed **Execution Status** observations conflict, the newest observation wins

## Example dialogue

> **Dev:** "If I resume an **Execution**, can the detail page say running while the sidebar still says paused?"
> **Domain expert:** "No. An **Execution Status** is a single fact, so both views must show the same state."

## Flagged ambiguities

- "status" was being treated as both a canonical execution fact and a view-local value — resolved: **Execution Status** is a single shared fact across the UI.
- "resume response" was being treated as a status fact — resolved: control responses are not the canonical **Execution Status**.
- "frontend status" was being derived separately by each screen — resolved: both views must use one shared **Execution Status Read Model**.
- "source of truth" was interpreted as websocket-only with no recovery path — resolved: websocket owns live transitions, while HTTP may repair missed status updates.
