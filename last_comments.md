P

Proceed
# Ahilney Platform — Product Requirements Document (v1)

**Document Status:** Draft — Ready for Review
**Prepared by:** Business-Expert Agent
**Date:** 2026-07-15
**Scope:** v1 — Patient App, Doctor/Provider App, Rehab Center Admin App, Ahilney Admin Dashboard

---

## 1. Product Overview

**Ahilney** is a multi-sided digital health platform connecting patients in need of rehabilitation services with medical doctors, individual rehabilitation service providers, and rehabilitation centers. The platform manages the full care journey — from initial medical consultation, through medical report issuance, to rehabilitation session booking, execution, and clinical progress tracking.

### 1.1 Platform Actors

| Actor | App Surface | Description |
|---|---|---|
| Patient | Patient App | End-user seeking medical consultation and/or rehabilitation services |
| Medical Doctor | Doctor / Provider App | Specialist who conducts video consultations and issues diagnosis + treatment plans |
| Home Care Rehab Provider | Doctor / Provider App | Individual rehabilitation specialist who delivers sessions at the patient's home |
| Rehabilitation Center | Rehab Center Admin App | An institution offering in-center rehabilitation sessions; managed by a center-level administrator |
| Ahilney Operations & Admin | Admin Dashboard | Internal Ahilney team managing the platform, verifying documents, onboarding providers, and overseeing finances and complaints |

### 1.2 Core Service Flows

1. **Online Consultation** → Patient books a doctor → video session → doctor issues Medical Report + Treatment Plan → patient unlocked for rehab booking
2. **Home Care** → Patient selects service type + filters → books a home-care rehab provider → provider executes sessions at home → provider logs clinical progress notes
3. **Rehab Center** → Patient selects a rehab center → books a session → center admin assigns to internal provider → provider executes session → logs progress notes

---

## 2. Patient App Requirements

### 2.1 Registration & Onboarding

**R-PA-001:** The registration flow SHALL collect user details and verify the user via OTP. The OTP flow is accepted as-is.

**R-PA-002 (Business Rule — Medical Report Gate):** A newly registered patient SHALL NOT be able to book any rehabilitation service (Home Care or Rehab Center) until they have at least one approved medical report on their profile.

- If no approved report exists, the rehabilitation booking entry points SHALL display a contextual message directing the patient to complete an Online Consultation first.
- Once the patient's medical report is approved by the Ahilney operations team, the rehabilitation booking flow SHALL be permanently unlocked (no expiry in v1).
- The `valid_until` field SHALL be stored as a nullable column in the medical document schema to enable expiry enforcement in v2 without a migration.

### 2.2 Home Screen — Service Navigation

**R-PA-010: Online Consultation**
- Entry point to book a video consultation with a medical specialist.
- Specialty taxonomy (v1 baseline — must be admin-configurable for future additions):
  - Orthopedic Physician
  - Orthopedic Surgeon
  - Neurosurgery / Neurology
  - Nutrition Specialist
  - Psychiatry / Psychology
  - Physical Medicine, Rheumatology & Rehabilitation
  - Pediatrics
- Each specialty displays the list of available doctors belonging to it.
- Doctors may be tagged to multiple specialties (many-to-many relationship).

**R-PA-011: Rehab Centers (formerly "Clinic Hub")**
- The service SHALL be renamed from "Clinic Hub" to "Rehab Centers" (or the official Arabic brand name when finalized).
- Each center SHALL have a profile page displaying: center name, description, available services, contact information.
- Patients browse and book sessions through this entry point.

**R-PA-012: Home Care**
- Before displaying service providers, the patient SHALL apply filters in this priority order:
  1. **Service Category** (mandatory first filter):
     - Physical Therapy (PT)
     - Post-Injury Rehabilitation
     - Elderly Rehabilitation
     - Special Needs Rehabilitation
     - Pediatric Rehabilitation
     - Nutritional Rehabilitation
     - Manual Therapy (Chiropractic / Osteopathy)
     - Basic Recovery & Wellness Services
  2. **Gender** (Male / Female)
  3. **Location** (Governorate → City)
  4. **Price Range** (configurable ranges, not hardcoded)
  5. **Professional Level** (Specialist / Senior Specialist / Expert / Consultant)
- Services that cannot be delivered at home (e.g., Hydrotherapy) SHALL be flagged `home_care_eligible: false` in the service taxonomy and excluded from Home Care results.

### 2.3 Medical Records

**R-PA-020:** The Medical Records section SHALL be divided into three distinct sub-sections with separate authoring permissions:

**Section A — Patient Information (patient-authored)**
- Patient writes a free-text description of their current condition and symptoms.
- Patient can edit this section at any time.

**Section B — Medical Documents (patient-uploaded)**
- Dedicated upload area for: medical report, radiology images (X-ray, MRI, CT), lab results, and any other supporting medical files.
- Supported file formats and size limits SHALL be defined during technical design (DICOM files for radiology must be considered).
- The medical report document is the prerequisite for unlocking rehabilitation booking (see R-PA-002).
- Document status lifecycle: `pending_review → approved / rejected`.
- Patients are notified of review outcome (approved or rejected with reason).
- Patients MAY upload additional documents; each new document goes through the same review flow.

**Section C — Clinical Progress Notes (provider-authored)**
- This section is READ-ONLY for the patient.
- WRITE access is restricted to the assigned rehabilitation provider.
- One entry is created per completed session, containing:
  - Condition assessment
  - Therapeutic progress
  - Functional changes
  - Clinical observations
  - Any adjustments to the treatment plan
- Entries are timestamped and linked to the specific session.
- This section forms the per-session data structure that will power the Case Timeline in v2.

**Role-Based Access Control Summary:**

| Section | Patient | Doctor | Rehab Provider | Admin |
|---|---|---|---|---|
| A — Patient Info | Read/Write | Read | Read | Read |
| B — Medical Docs | Upload/Read | Read | Read | Read/Approve/Reject |
| C — Progress Notes | Read | Read | Read/Write | Read |

### 2.4 Appointments

**R-PA-030:** The Appointments screen SHALL display: doctor/provider details, appointment date/time, service value, and booking status.

**R-PA-031:** After a consultation is completed, two permanent document sections SHALL appear within the appointment record:
- **Doctor Medical Report:** Final report issued by the doctor (diagnosis, examination findings, recommendations, contraindications/warnings).
- **Treatment Plan:** Rehabilitation plan issued by the doctor (goals, number of proposed sessions, program type, required services, progress KPIs, specific instructions for the rehab provider).
These are two distinct document types with separate schemas. Both are accessible to the patient, the assigned rehab provider, and the admin.

### 2.5 Services Screen

**R-PA-040:** The Services screen SHALL serve as the unified search and browse hub where patients initiate service selection using filters. It SHALL NOT be a static catalog only. Search and filter capabilities SHALL be integrated into this screen as the entry point for service discovery.

### 2.6 Navigation

**R-PA-050:** ALL screens in the Patient App SHALL have a consistent Back navigation mechanism (Back button in the App Bar or equivalent OS-native navigation). No screen SHALL require the user to restart their session journey to navigate backward.

### 2.7 Wallet

**R-PA-060:** The patient wallet SHALL trigger push + in-app notifications in these scenarios:
- Balance falls below a configurable low-balance threshold.
- Balance is nearly depleted (second configurable threshold).
- Balance reaches zero.
- Notification thresholds SHALL be configurable by the Ahilney admin team.
- Notifications SHALL NOT fire during a pending top-up transaction to avoid false alerts.

### 2.8 Online Consultation — Failover

**R-PA-070:** If the booked doctor is unable to conduct the consultation (emergency, technical issue, no-show, or doctor-initiated cancellation), the system SHALL:
1. Automatically find the next available doctor of the same specialty.
2. Notify the patient of the reassignment with the new doctor's details.
3. Update the original booking record with the reason for reassignment.
4. Present the new doctor with the reassigned case (accept/decline option).
5. If no alternative doctor is available in the specialty, notify the patient and offer: rescheduling or full refund.

### 2.9 Medical Document Validation

**R-PA-080:** All medical documents uploaded by patients (Section B) SHALL undergo review by the **Ahilney operations team** before they are considered valid.
- Review queue is managed inside the Admin Dashboard.
- Patient's rehabilitation booking remains blocked until at least one document is approved.
- Ops team SHALL be able to: approve, reject (with reason), or request resubmission.

### 2.10 Complaints & Support

**R-PA-090:** The Patient App SHALL provide a Complaints & Support entry point from which a patient can file a report against:
- A doctor
- A rehabilitation provider
- A rehabilitation center
- A specific session
- A financial issue
- A technical issue
- Any other concern (open text)

Each submission generates a complaint record tracked in the Admin Dashboard.

---

## 3. Doctor / Rehabilitation Provider App Requirements

### 3.1 Provider Types & Workflows

The app SHALL support two distinct account types, each with a different operational workflow:

**Type 1 — Medical Doctor**
- Reviews patient complaint, uploaded medical documents (Section B), radiology, and attachments before the consultation.
- Conducts video consultation.
- After the consultation, records three mandatory outputs:
  - **A. Chief Complaint:** Concise summary of the patient's complaint.
  - **B. Medical Diagnosis:** Final clinical diagnosis.
  - **C. Rehabilitation Treatment Plan:** Structured plan for the rehab provider.
- Submitting this form triggers real-time synchronization to the patient's profile and any assigned rehab provider's case file (see R-SYS-001).

**Type 2 — Home Care Rehabilitation Provider**
- Receives case assignments with pre-loaded: medical report, diagnosis, and treatment plan.
- Executes rehabilitation sessions at the patient's location.
- After each session, logs Clinical Progress Notes (Medical Records Section C).
- Manages their own availability schedule.

### 3.2 Clinical Data Synchronization

**R-SYS-001 (Critical):** Upon doctor sign-off on the post-consultation form (Diagnosis + Treatment Plan), the data SHALL be pushed **in real-time** (via WebSocket, push notification, or server-sent events) to:
- The patient's Medical Records (Section B — Medical Report; Section C feed — Treatment Plan).
- The assigned rehab provider's case file.

The rehab provider's app SHALL update without requiring a manual refresh.

If the doctor edits a submitted report after sign-off:
- The revision SHALL propagate in real-time.
- The system SHALL display a prominent "Report Updated" alert on the provider's active case view.
- Version history SHALL be maintained (original + all revisions timestamped).

### 3.3 Availability Schedule

**R-PRV-010:** All provider types (doctors and rehab providers) SHALL define and maintain an availability schedule specifying:
- Available days of the week.
- Working hours per day.
- Booked/reserved slots (system-managed).
- Manually blocked periods (provider-managed).

This schedule drives the booking calendar for all provider types.

If a provider updates availability after a booking is confirmed, the affected patient SHALL be notified automatically.

### 3.4 Sessions Management

**R-PRV-020:** Sessions SHALL be separated into two views:
- **Upcoming Sessions:** Sessions not yet executed. Displayed in the primary active view.
- **Completed Sessions:** Moved to History/Archive after completion. Retained for: reporting, statistics, medical review, and financial reconciliation.

The active session list SHALL NOT include completed sessions.

### 3.5 Pre-Session Case Information

**R-PRV-030:** Before beginning any session, the provider SHALL have access to all relevant case information:
- **Doctor:** Patient's complaint summary, all uploaded medical documents, radiology files, attachments.
- **Rehab Provider:** Doctor's medical report, diagnosis, and treatment plan (or the externally approved medical report if the patient did not use the platform's Online Consultation).

### 3.6 Wallet & Financial Dashboard

**R-PRV-040:** Each completed session SHALL display a transparent financial breakdown:
- Total session value
- Provider's share (%)
- Ahilney platform commission (%)
- Payment processor fee (%)
- Taxes (if applicable)
- Referral commission (% — nullable)
- **Net amount payable to provider**

All commission and fee rates SHALL be pulled from the `service_type_commission` configuration table managed in the Admin Dashboard. Rates apply per service type of the session, not per individual provider.

### 3.7 Legal Disclaimer

**R-PRV-050:** The Terms & Conditions SHALL include a clause explicitly stating that the patient bears full legal responsibility for the accuracy and authenticity of all medical documents uploaded to the platform. Ahilney and its team bear no legal or medical liability for decisions made based on falsified or misleading documents submitted by users.

### 3.8 Complaints & Support

**R-PRV-060:** The Provider App SHALL provide a Complaints & Support entry point from which a provider can file a report against:
- A patient
- A rehabilitation center (where applicable)
- A booking issue
- A payment issue
- Any other operational concern

---

## 4. Rehabilitation Center Admin App Requirements

### 4.1 Overview

The Rehabilitation Center Admin App is a **separate dedicated application** for center-level administrators. It is distinct from the individual provider app.

### 4.2 Core Functions

**R-RCA-010:** Center Admin SHALL be able to:
- View all incoming bookings assigned to their center.
- Assign each booking to an appropriate internal provider based on case type and specialty.
- For small centers with a single provider: route all bookings directly to that provider.
- For medium/large centers: distribute bookings across the internal provider roster by specialty and availability.

**R-RCA-020:** The Center Admin app SHALL display:
- Center profile management (services offered, contact information).
- Real-time booking queue.
- Internal provider roster (names, specialties, current caseload).
- Session status overview (upcoming, in-progress, completed).

**R-RCA-030:** The center's availability and capacity SHALL be reflected in the Patient App booking calendar. If the center has no available slots, the booking option SHALL be unavailable.

**R-RCA-040:** Center Admins SHALL be created and managed by the Ahilney Admin Dashboard (manual admin-add — no self-registration).

---

## 5. Ahilney Admin Dashboard Requirements

### 5.1 Service Providers Management

**R-ADM-010:** The Admin Dashboard SHALL support three distinct provider entity types:
1. Medical Doctors
2. Individual Rehabilitation Providers (Home Care)
3. Rehabilitation Centers (including their Center Admin accounts)

**R-ADM-011:** The Admin team SHALL be able to perform full CRUD operations on all provider types:
- Create a new doctor/provider/center account (manual add — no self-registration exists).
- Edit any provider's profile, credentials, and service tags.
- Suspend or deactivate an account.
- Delete an account.

**R-ADM-012:** Each provider creation form SHALL capture all fields required for the provider's workflow (specialty tags, service types, professional level, location, price, etc.).

### 5.2 Medical Document Review Queue

**R-ADM-020:** A dedicated Document Review Queue SHALL be available to the Ahilney operations team (a sub-role within the Admin Dashboard — not full super-admin).

The queue SHALL display all pending patient-uploaded medical documents with:
- Patient name and ID
- Document type and upload timestamp
- Document preview / download
- Action buttons: **Approve** / **Reject** (with mandatory rejection reason) / **Request Resubmission**

Upon action:
- Patient is notified of the outcome.
- If approved: patient's rehabilitation booking gate is unlocked.
- If rejected: patient is shown the rejection reason and prompted to re-upload.

### 5.3 Dashboard Summary (KPI)

**R-ADM-030:** The Dashboard Summary SHALL be split into two independent KPI sections:

**Medical Doctors Summary:**
- Total active doctors
- Consultations completed (total / this period)
- Consultations in progress
- Average doctor response time
- Revenue from medical consultations (this period / cumulative)

**Rehabilitation Providers Summary:**
- Total active providers (home care + centers)
- Sessions completed (total / this period)
- Upcoming sessions
- Service type distribution (breakdown by category)
- Revenue from rehabilitation services (this period / cumulative)
- Operational KPIs (e.g., cancellation rate, average sessions per case)

### 5.4 Geographic Hierarchy Management

**R-ADM-040:** The Locations Management section SHALL support a full geographic cascade:
- Countries
- Governorates / States
- Cities
- Districts (optional, as needed)

This hierarchy SHALL be used for: provider location tagging, patient search filters (Home Care), and geographic-based reporting.

### 5.5 Financial Management

**R-ADM-050:** The Financial Management module SHALL provide detailed reports and statistics including:
- Total platform revenue
- Total payouts to providers (broken down by provider type)
- Ahilney platform commissions (broken down by service type)
- Payment processor fees
- Tax amounts
- Referral commissions (if applicable)
- Pending amounts (booked but session not yet completed)
- Outstanding amounts (due to providers, pending payout)
- Refunds processed
- All reports SHALL be filterable by time period (day / week / month / custom range)

**R-ADM-051 — Commission Configuration:**
- A `service_type_commission` configuration table SHALL be manageable from the Admin Dashboard.
- Fields per service type: platform commission %, payment processor fee %, tax rate %, referral commission % (nullable).
- Changes to rates take effect immediately without requiring an app update.
- Historical rate snapshots SHALL be retained so past transactions always reflect the rate that was active at transaction time.

### 5.6 Patients Management

**R-ADM-060:** The Admin Dashboard SHALL have a Patients Management section. The specific required data fields and report types per patient case are to be defined by the client in a follow-up session. This section is confirmed in v1 scope.

### 5.7 Sub-Admin Management

**R-ADM-070:** The Admin Dashboard SHALL support Sub-Admin accounts with granular role-based permissions. The specific permission levels, role structure, and workflow are to be defined by the client in a follow-up session. This section is confirmed in v1 scope.

### 5.8 Promo Codes

**R-ADM-080:** A Promo Code management module SHALL be included in v1. The specific mechanics (discount types, validity rules, usage limits, applicable services) are to be defined by the client in a follow-up session. This section is confirmed in v1 scope.

### 5.9 Complaints & Support Center

**R-ADM-090:** A dedicated Complaints & Support Center module SHALL be present in the Admin Dashboard, handling complaints from both patients and providers.

Each complaint record SHALL contain:
- Complaint number (auto-generated)
- Creation date & time
- Complainant (patient or provider, with link to profile)
- Respondent (the party complained against, with link to profile)
- Complaint type (doctor / rehab provider / rehab center / session / financial / technical / other)
- Status: `New → Under Review → Awaiting Response → Resolved → Closed`
- Priority level (Low / Medium / High / Urgent — set by admin)
- Assigned staff member (ops team member responsible)
- Full audit log of all actions and comments (immutable, timestamped)
- File attachment support (documents, screenshots)
- Link to the related booking/session (if applicable) — enables the admin to review full case context before making a decision

**R-ADM-091:** In v1, complaint status transitions are manual (set by the assigned ops staff member). Automated SLA timers and escalation rules are deferred to v2.

**R-ADM-092:** The module SHALL be designed as a **Complaints & Support Center** (not complaints-only), capable of handling:
- Complaints
- Inquiries
- Requests
- Technical reports

This design ensures the system is extensible to a full support ticketing system in v2 without requiring a new module.

---

## 6. Cross-Cutting Requirements

### 6.1 Real-Time Data Synchronization

**R-SYS-001** (referenced in §3.2): A real-time push mechanism (WebSocket, push notification, or SSE) is required for clinical data propagation. This is a backend infrastructure requirement that must be addressed in the technical architecture phase.

### 6.2 Data Model — Key Entities

The following entities and relationships must be defined in the data model design phase (next step):

- `User` (patient, doctor, rehab provider, center admin, ops admin)
- `MedicalDocument` (with `status`, `valid_until` nullable, `version`)
- `ConsultationAppointment` (with `MedicalReport` and `TreatmentPlan` sub-documents)
- `ClinicalProgressNote` (linked to `Session`, authored by provider)
- `RehabilitationCenter` (with admin relationship, provider roster)
- `ServiceType` (with `home_care_eligible` flag)
- `ServiceTypeCommission` (commission config per service type, with history)
- `Complaint` (with `AuditLog` sub-entity)
- `GeographicHierarchy` (Country → Governorate → City → District)
- `AvailabilitySchedule` (per provider, drives booking calendar)

### 6.3 v2 Features (Deferred)

The following are confirmed out of v1 scope but the data structures SHALL be designed v2-ready from day one:

| Feature | v2 Design Dependency |
|---|---|
| Case Timeline (visual journey view) | ClinicalProgressNote per-session structure (built in v1) |
| Medical report expiry enforcement | `valid_until` nullable field (built in v1) |
| Complaint SLA & automated escalation | Complaint status + audit log (built in v1) |

---

## 7. Open Items (Pending Client Input)

| # | Item | Action Required |
|---|---|---|
| 1 | Patients Management — required data fields & report types per case | Client to provide detailed list |
| 2 | Sub-Admin roles — permission levels & role structure | Client to define in follow-up meeting |
| 3 | Promo Codes — discount mechanics, validity rules, usage limits | Client to define in follow-up meeting |
| 4 | Ops team internal SLA for document review | Ahilney ops to define internally (affects patient-facing messaging) |
| 5 | Rehab Center Admin App — MVP screens list | To be scoped in a dedicated session |
| 6 | Supported file formats & size limits for medical document uploads | Technical design decision |
| 7 | Payment gateway integrations | To be confirmed (affects processor fee configuration) |

---

## 8. Next Steps

1. **Client review** of this PRD — confirm, amend, or add requirements.
2. **Data model design** — entity-relationship diagram for all confirmed entities.
3. **Rehab Center Admin App MVP scoping** — dedicated session to define screens and user stories.
4. **Resolve open items** (§7) before Admin Dashboard and Patients Management sprint planning.
5. **Technical architecture** — real-time sync infrastructure, file storage, auth system for 4 app surfaces.
6. **Sprint planning** — once PRD is signed off and open items resolved.
[@UI-Expert](mention://agent/224a1986-01ff-4298-a623-33f0d6c40480) Implement the above scope into a new version of prototype, you can use kind of branching or semantic versioning to let me switch between versions easily
