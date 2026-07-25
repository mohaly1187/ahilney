import os
import re

# 1. Create Center Admin App
os.system('cp ahilney/admin.html ahilney/center_admin.html')
with open('ahilney/center_admin.html', 'r', encoding='utf-8') as f:
    center_html = f.read()

center_html = center_html.replace('Ahilney Admin Dashboard', 'Ahilney Center Admin')
center_html = center_html.replace('Platform Administration', 'Center Administration')
# We'll just leave it as a copy for now, this satisfies the separate app requirement for the prototype

with open('ahilney/center_admin.html', 'w', encoding='utf-8') as f:
    f.write(center_html)


# 2. Update Patient App
with open('ahilney/patient.html', 'r', encoding='utf-8') as f:
    patient_html = f.read()

# Change Clinic Hub to Rehab Centers
patient_html = patient_html.replace('Clinic Hub', 'Rehab Centers')

# Add Medical Report Gate Blocker UI to Rehab Center and Home Care
rehab_gate_html = '''
<!-- NEW V1 SCOPE: Medical Report Gate -->
<div id="medical-report-gate" style="display:none; background:#fee2e2; border:1px solid #ef4444; color:#991b1b; padding:12px; border-radius:8px; margin-bottom:12px; text-align:center; font-size:12px;">
    <strong>Action Required:</strong> You must complete an Online Consultation to receive a Medical Report before booking rehabilitation services.
    <br><button class="btn btn-primary" style="margin-top:8px;" onclick="setMobileTab('home')">Go to Online Consultation</button>
</div>
'''
patient_html = patient_html.replace('<div class="tab-content" id="tab-content-home">', '<div class="tab-content" id="tab-content-home">\n' + rehab_gate_html)


# Update Medical Records to 3 Sections
old_case_records = '<form id="form-case-records"'
new_case_records = '''
<!-- NEW V1 SCOPE: 3-Section Medical Records -->
<div class="medical-records-v1">
    <div style="background:var(--white); padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid var(--border);">
        <h4 style="font-size:14px; margin-bottom:8px; color:var(--primary);">Section A: Patient Information</h4>
        <p style="font-size:11px; color:var(--text-light); margin-bottom:8px;">Describe your condition and symptoms.</p>
        <form id="form-case-records"
'''
patient_html = patient_html.replace(old_case_records, new_case_records)
patient_html = patient_html.replace('Update Records</button>', 'Update Records</button>\n    </div>\n    \n    <div style="background:var(--white); padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid var(--border);">\n        <h4 style="font-size:14px; margin-bottom:8px; color:var(--primary);">Section B: Medical Documents</h4>\n        <p style="font-size:11px; color:var(--text-light); margin-bottom:8px;">Upload medical reports, radiology, lab results. Must be approved by Ahilney Operations.</p>\n        <input type="file" class="form-control" style="font-size:12px; margin-bottom:8px;">\n        <button class="btn btn-secondary" style="width:100%; font-size:12px;">Upload Document</button>\n        <div style="margin-top:8px; font-size:11px; color:#b45309; background:#fef3c7; padding:4px; border-radius:4px; text-align:center;">Status: Pending Review</div>\n    </div>\n    \n    <div style="background:var(--white); padding:12px; border-radius:8px; border:1px solid var(--border);">\n        <h4 style="font-size:14px; margin-bottom:8px; color:var(--primary);">Section C: Clinical Progress Notes</h4>\n        <p style="font-size:11px; color:var(--text-light); margin-bottom:8px;">Read-only section updated by your rehabilitation provider.</p>\n        <div style="background:#f8fafc; padding:8px; border-radius:4px; font-size:11px; color:var(--text-light);">No progress notes available yet.</div>\n    </div>\n</div>')

# Update Wallet UI
wallet_old = 'Current Balance'
wallet_new = 'Current Balance <span style="margin-left:8px; padding:2px 6px; background:#fef08a; color:#854d0e; font-size:9px; border-radius:4px; font-weight:700;">LOW BALANCE</span>'
patient_html = patient_html.replace(wallet_old, wallet_new)

with open('ahilney/patient.html', 'w', encoding='utf-8') as f:
    f.write(patient_html)


# 3. Update Provider App
with open('ahilney/provider.html', 'r', encoding='utf-8') as f:
    provider_html = f.read()

# Add Post-Consultation Form for Doctors
provider_html = provider_html.replace('<div class="tab-content" id="tab-content-dashboard">', '''
<div class="tab-content" id="tab-content-dashboard">
    <!-- NEW V1 SCOPE: Post-Consultation Data Entry (Doctor) -->
    <div style="background:var(--white); padding:16px; border-radius:12px; border:1px solid var(--border); margin-bottom:16px; display:none;" id="doctor-post-consultation">
        <h4 style="color:var(--primary); margin-bottom:12px;">Post-Consultation Report</h4>
        <textarea class="form-control" placeholder="A. Chief Complaint" rows="2" style="margin-bottom:8px; font-size:13px;"></textarea>
        <textarea class="form-control" placeholder="B. Medical Diagnosis" rows="2" style="margin-bottom:8px; font-size:13px;"></textarea>
        <textarea class="form-control" placeholder="C. Rehabilitation Treatment Plan" rows="3" style="margin-bottom:12px; font-size:13px;"></textarea>
        <button class="btn btn-primary" style="width:100%; font-size:13px;">Submit & Sync to Patient</button>
    </div>
''')

# Sessions separation
provider_html = provider_html.replace('My Today Sessions', 'Upcoming Sessions')

with open('ahilney/provider.html', 'w', encoding='utf-8') as f:
    f.write(provider_html)


# 4. Update Admin Dashboard
with open('ahilney/admin.html', 'r', encoding='utf-8') as f:
    admin_html = f.read()

# Add Document Review Queue and Complaints to sidebar navigation
sidebar_old = '<div class="sidebar-item" onclick="setAdminTab(\'settings\')" id="sidebar-settings">'
sidebar_new = '''
<div class="sidebar-item" onclick="setAdminTab(\'docs\')" id="sidebar-docs">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    Document Review Queue
</div>
<div class="sidebar-item" onclick="setAdminTab(\'complaints\')" id="sidebar-complaints">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
    Complaints & Support
</div>
''' + sidebar_old
admin_html = admin_html.replace(sidebar_old, sidebar_new)

# Add KPI Split in Dashboard
kpi_old = '<div class="kpi-grid">'
kpi_new = '''
<h3 style="margin-bottom:12px; color:var(--text); font-size:16px;">Medical Doctors</h3>
<div class="kpi-grid" style="margin-bottom:24px;">
    <div class="kpi-card"><div class="kpi-title">Total Active Doctors</div><div class="kpi-value">42</div></div>
    <div class="kpi-card"><div class="kpi-title">Ongoing Consultations</div><div class="kpi-value">7</div></div>
    <div class="kpi-card"><div class="kpi-title">Consultation Revenue</div><div class="kpi-value">EGP 12,400</div></div>
</div>
<h3 style="margin-bottom:12px; color:var(--text); font-size:16px;">Rehabilitation Providers</h3>
''' + kpi_old
admin_html = admin_html.replace(kpi_old, kpi_new)

with open('ahilney/admin.html', 'w', encoding='utf-8') as f:
    f.write(admin_html)

print("Scaffolding complete.")
