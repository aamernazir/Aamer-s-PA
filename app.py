import streamlit as st
import json
import os
from google import genai
from google.genai import types

DB_FILE = "database.json"

# --- 1. INITIALIZE PERSISTENT DATABASE ---
DEFAULT_DATA = {
    "projects": [
        {
            "id": 1,
            "title": "Grant Alpha - Horizon Europe",
            "budget": "$250,000",
            "wps": [
                {"name": "WP1: Literature & Initial Design", "progress": 100},
                {"name": "WP2: Prototype Development", "progress": 40},
                {"name": "WP3: Field Testing & Data", "progress": 0}
            ]
        }
    ],
    "funding_opps": [
        {"title": "NSF Advanced Computing Grant", "deadline": "2026-11-15", "status": "Drafting"}
    ],
    "aps_gaps": [
        {"id": "GAP_01", "category": "Teaching", "description": "Student course evaluations summary", "status": "Open"},
        {"id": "GAP_02", "category": "Research", "description": "2 High-impact journal papers submitted", "status": "In Progress"},
        {"id": "GAP_03", "category": "Societal Benefits", "description": "Industry workshop outreach", "status": "Open"}
    ],
    "aps_evidence": [],
    "research": {
        "papers": ["3D Neural Modeling Draft (2026)", "Quantum Sensors Review"],
        "patents": ["US Patent Pending 18/982,123"]
    }
}

def load_data():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump(DEFAULT_DATA, f, indent=4)
        return DEFAULT_DATA
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Load data into session state
if "db" not in st.session_state:
    st.session_state.db = load_data()

db = st.session_state.db

# --- PAGE CONFIGURATION ---
st.set_page_config(page_title="AN Personal Assistant", layout="wide")
st.title("🛡️ AN Personal Assistant")

# Sidebar - Gemini API Key Setup
st.sidebar.header("⚙️ Configuration")
api_key = st.sidebar.text_input("Google AI Studio API Key (Free)", type="password")

st.sidebar.markdown("---")
st.sidebar.subheader("📤 AI Document Auto-Filler")
uploaded_file = st.sidebar.file_uploader("Upload Weekly PDF, Image, or Notes", type=["pdf", "png", "jpg", "txt"])

# --- 2. GEMINI AI AUTO-EXTRACTION FUNCTION ---
if uploaded_file and api_key:
    if st.sidebar.button("🤖 Process File & Auto-Fill Modules"):
        try:
            client = genai.Client(api_key=api_key)
            bytes_data = uploaded_file.read()
            
            prompt = f"""
            You are an executive research assistant. Analyze this uploaded file against my database schema.
            Current Database: {json.dumps(db)}
            
            Extract any relevant work progress, completed tasks, new APS evidence, papers, or grant updates.
            Return ONLY a valid JSON object matching the database schema with the new/updated items included.
            Do not include Markdown backticks or extra text.
            """
            
            mime_type = uploaded_file.type
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(data=bytes_data, mime_type=mime_type),
                    prompt
                ]
            )
            
            cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
            updated_db = json.loads(cleaned_json)
            
            st.session_state.db = updated_db
            save_data(updated_db)
            st.sidebar.success("Database successfully updated from document!")
            st.rerun()
            
        except Exception as e:
            st.sidebar.error(f"Error processing file: {e}")

# --- 3. THE 4 MODULE TABS ---
tab1, tab2, tab3, tab4 = st.tabs([
    "📂 Module 01: Project Dashboard", 
    "📈 Module 02: Strategic Positioning", 
    "📊 Module 03: Annual Performance System (APS)", 
    "✨ Module 04: Research Intelligence"
])

# MODULE 01: PROJECT DASHBOARD
with tab1:
    st.header("Project Management & Work Packages")
    for proj in db["projects"]:
        with st.expander(f"📌 {proj['title']} — Budget: {proj['budget']}", expanded=True):
            st.subheader("Work Packages Progress")
            for idx, wp in enumerate(proj["wps"]):
                col1, col2 = st.columns([3, 1])
                with col1:
                    new_prog = st.slider(wp["name"], 0, 100, wp["progress"], key=f"wp_{proj['id']}_{idx}")
                    if new_prog != wp["progress"]:
                        wp["progress"] = new_prog
                        save_data(db)
                with col2:
                    if st.button("Mark 100% Done", key=f"btn_{proj['id']}_{idx}"):
                        wp["progress"] = 100
                        save_data(db)
                        st.rerun()

# MODULE 02: STRATEGIC POSITIONING
with tab2:
    st.header("Funding & Competitive Landscape")
    st.table(db["funding_opps"])
    
    with st.form("add_funding"):
        st.subheader("Add New Funding Opportunity")
        opp_title = st.text_input("Opportunity Name")
        opp_date = st.date_input("Deadline")
        if st.form_submit_button("Save Opportunity"):
            db["funding_opps"].append({"title": opp_title, "deadline": str(opp_date), "status": "Drafting"})
            save_data(db)
            st.success("Opportunity Added!")
            st.rerun()

# MODULE 03: ANNUAL PERFORMANCE SYSTEM (APS)
with tab3:
    st.header("APS Self-Performance Evaluation")
    
    col_a, col_b = st.columns(2)
    with col_a:
        st.subheader("Tracked Gaps")
        for gap in db["aps_gaps"]:
            st.info(f"**[{gap['id']}] {gap['category']}**: {gap['description']} — *Status: {gap['status']}*")
            
    with col_b:
        st.subheader("Logged Evidence Items")
        if db["aps_evidence"]:
            for item in db["aps_evidence"]:
                st.success(f"✔️ {item}")
        else:
            st.write("No evidence logged yet. Use the sidebar AI file uploader to auto-extract evidence from PDFs.")

# MODULE 04: RESEARCH INTELLIGENCE
with tab4:
    st.header("Research, Papers & Patents")
    st.subheader("Active Papers & Drafts")
    for paper in db["research"]["papers"]:
        st.write(f"📄 {paper}")
        
    st.subheader("Patents & IP")
    for patent in db["research"]["patents"]:
        st.write(f"💡 {patent}")
