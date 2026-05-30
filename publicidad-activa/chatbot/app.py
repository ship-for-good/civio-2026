from flask import Flask, request, jsonify
import requests
import json
import os

app = Flask(__name__)

MISTRAL_API_KEY = "WKxOPHkvqQKyC7aA8a6vXC7WC9YNcJEt"

# Load scraped data
try:
    with open('scraped_data.json', 'r', encoding='utf-8') as f:
        SCRAPED_DATA = json.load(f)
except FileNotFoundError:
    SCRAPED_DATA = []

# Sample FAQ data (in Spanish)
faqs = {
    "¿Qué es el portal de transparencia?": "El portal de transparencia es una plataforma donde los organismos públicos en España publican información clave como contratos, subvenciones y organigramas.",
    "¿Cómo presento una solicitud?": "Puedes presentar una solicitud navegando a la sección 'Presentar una solicitud' en el portal de transparencia y completando el formulario.",
    "¿Qué información puedo solicitar?": "Puedes solicitar información como contratos, subvenciones, salarios de altos cargos y organigramas.",
    "¿Cuánto tiempo se tarda en recibir una respuesta?": "La administración tiene 1 mes para responder, que puede extenderse a 2 meses en algunos casos.",
    "¿Qué pasa si no recibo una respuesta?": "Si no recibes una respuesta, puedes escalar tu solicitud al Consejo de Transparencia y Buen Gobierno."
}

# Function to search scraped data for relevant information and links
def search_scraped_data(question):
    question_lower = question.lower()
    relevant_info = []
    relevant_links = []
    
    # Keywords for specific topics
    salary_keywords = ['salary', 'salaries', 'salarios', 'retribuciones', 'nóminas']
    contract_keywords = ['contract', 'contracts', 'contratos', 'licitaciones']
    
    for page in SCRAPED_DATA:
        # Search in title
        if 'title' in page and question_lower in page['title'].lower():
            relevant_info.append(f"Title: {page['title']}")
        
        # Search in headings
        if 'headings' in page:
            for heading in page['headings']:
                if question_lower in heading['text'].lower():
                    relevant_info.append(f"Heading: {heading['text']}")
        
        # Search in paragraphs
        if 'paragraphs' in page:
            for paragraph in page['paragraphs']:
                if question_lower in paragraph.lower():
                    relevant_info.append(f"Info: {paragraph}")
        
        # Search in links
        if 'links' in page:
            for link in page['links']:
                if question_lower in link['text'].lower():
                    relevant_links.append(link)
        
        # Search in tables (for salary data)
        if 'tables' in page and any(keyword in question_lower for keyword in salary_keywords):
            for table in page['tables']:
                if table:
                    relevant_info.append("Table data found (salary information):")
                    for row in table[:5]:  # Show first 5 rows as preview
                        relevant_info.append(" | ".join(row))
    
    # Prepare the response
    response = ""
    if relevant_info:
        response += "Relevant information from the transparency portal:\n\n"
        response += "\n".join(relevant_info)
    
    if relevant_links:
        response += "\n\nRelevant links:\n"
        for i, link in enumerate(relevant_links, 1):
            response += f"\n{i}. [{link['text']}]({link['url']})"
    else:
        # Provide direct links for common topics (in Spanish)
        if any(keyword in question_lower for keyword in salary_keywords):
            response += "\n\nPara información sobre salarios en el sector público, visite los siguientes enlaces directos del Portal de Transparencia:\n"
            response += "1. [Altos Cargos](https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos): Información sobre salarios de altos cargos del gobierno.\n"
            response += "   - Resumen: En este enlace encontrará información detallada sobre las retribuciones de los altos cargos del gobierno, incluyendo ministros, secretarios de estado, y otros funcionarios de alto nivel.\n"
            response += "2. [Organización y Empleo Público](https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo): Datos sobre la organización y empleo en el sector público.\n"
            response += "   - Resumen: Este enlace proporciona información sobre la estructura organizativa y el empleo en el sector público, incluyendo datos sobre salarios y retribuciones.\n"
            response += "3. [Boletín Oficial del Estado (BOE)](https://www.boe.es): Para consultar los sueldos oficiales de los altos cargos y funcionarios públicos.\n"
            response += "   - Resumen: En el BOE encontrará los sueldos oficiales de los altos cargos y funcionarios públicos, incluyendo detalles sobre las retribuciones y complementos.\n"
            
            # Add specific information about high salaries
            if "90.000" in question or "más de 90.000" in question:
                response += "\n\nCargos que suelen cobrar más de 90.000 euros al año:\n"
                response += "- Presidentes y consejeros de empresas públicas (Renfe, Correos, AENA, etc.).\n"
                response += "- Altos cargos de la Administración General del Estado (subsecretarios, directores generales).\n"
                response += "- Magistrados del Tribunal Supremo o Tribunal Constitucional.\n"
                response += "- Presidentes de comunidades autónomas y consejeros autonómicos.\n"
                response += "- Directivos de organismos reguladores (CNMC, Banco de España, etc.).\n"
                response += "\nPara obtener información más detallada, consulte los enlaces proporcionados o busque directamente en el Portal de Transparencia por ministerio o cargo."
        elif any(keyword in question_lower for keyword in contract_keywords):
            response += "\n\nPara información sobre contratos públicos, visite los siguientes enlaces directos del Portal de Transparencia:\n"
            response += "1. [Portal de Transparencia - Publicidad Activa](https://transparencia.gob.es/publicidad-activa/por-materias): Información general sobre contratos públicos.\n"
            response += "   - Resumen: Este enlace proporciona información general sobre los contratos públicos, incluyendo licitaciones, adjudicaciones, y datos sobre la contratación del sector público.\n"
            response += "2. [Plataforma de Contratación del Estado](https://contrataciondelestado.es): Plataforma oficial para la contratación pública en España.\n"
            response += "   - Resumen: Esta plataforma oficial proporciona acceso a información detallada sobre los contratos públicos, incluyendo licitaciones, adjudicaciones, y datos sobre la contratación del sector público."
    
    return response if response else None

# Function to generate responses using Mistral API with grounded data
def generate_response_with_mistral(question):
    try:
        # Search for relevant information in scraped data
        grounded_info = search_scraped_data(question)
        
        # Prepare the prompt with grounded information
        if grounded_info:
            prompt = f"""Based on the following information from the transparency portal (https://transparencia.gob.es):

{grounded_info}

Answer the user's question: {question}

Guidelines:
1. Provide a concise summary of the relevant information.
2. If there are relevant links, guide the user to them.
3. If no relevant information is found, suggest searching the transparency portal directly.
4. Keep the response clear and helpful."""
        else:
            prompt = f"""The user asked: {question}

I don't have specific information from the transparency portal about this. Guide the user to search the transparency portal (https://transparencia.gob.es) for more information."""
        
        # Use Mistral API to generate a response
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "mistral-small",  # Use mistral-small for quicker responses
            "messages": [{"role": "user", "content": prompt}]
        }
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"I'm sorry, I encountered an error while processing your request: {str(e)}"

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get('question', '')
    
    # Check if the question is in the FAQs
    if question in faqs:
        return jsonify({"answer": faqs[question]})
    else:
        # Use Mistral to generate a response
        answer = generate_response_with_mistral(question)
        return jsonify({"answer": answer})

@app.route('/faq', methods=['GET'])
def get_faqs():
    return jsonify(list(faqs.keys()))

if __name__ == '__main__':
    app.run(debug=True, port=5002)
