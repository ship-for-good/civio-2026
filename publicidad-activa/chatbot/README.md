# Transparency Chatbot

## Overview
This chatbot is designed to assist users with the [transparencia.gob.es](https://transparencia.gob.es/en/inicio) website. It can answer FAQs, guide users through the portal, and help them submit public information requests.

## Features
- Answer frequently asked questions about the transparency portal.
- Guide users to find the information they need.
- Assist users in submitting public information requests.
- Track the status of user requests.
- Escalate issues to the appropriate channels.

## Tech Stack
- **Backend:** Python (Flask)
- **NLP Model:** Mistral
- **Database:** SQLite
- **Frontend:** Streamlit

## Setup

### Prerequisites
- Python 3.8+
- Virtual environment (recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd transparency_chatbot
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install flask streamlit sqlite3
   ```

### Running the Chatbot
1. Start the Flask backend:
   ```bash
   python app.py
   ```

2. Start the Streamlit frontend:
   ```bash
   streamlit run chatbot.py
   ```

## Usage
- Open the Streamlit app in your browser at `http://localhost:8501`.
- Interact with the chatbot to get answers to your questions or submit a request.

## API Endpoints
- **POST /ask:** Submit a question to the chatbot.
  - Request body: `{"question": "How do I submit a request?"}`
  - Response: `{"answer": "You can submit a request by..."}`

- **GET /faq:** Get a list of frequently asked questions.
  - Response: List of FAQs.

## Future Improvements
- Integrate with the transparency portal API for real-time data.
- Add support for multiple languages.
- Implement user authentication for tracking requests.

## License
This project is licensed under the MIT License.
