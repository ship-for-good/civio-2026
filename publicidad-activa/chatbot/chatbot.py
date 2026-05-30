import streamlit as st
import requests

st.set_page_config(page_title="Transparency Chatbot", page_icon="🤖")
st.title('Transparency Chatbot')

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("What is your question?"):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)

    # Send the question to the Flask backend
    response = requests.post("http://127.0.0.1:5002/ask", json={"question": prompt})
    if response.status_code == 200:
        answer = response.json().get("answer", "I'm sorry, I don't have an answer to that question.")
    else:
        answer = "I'm sorry, I encountered an error while processing your request."

    # Display assistant response in chat message container
    with st.chat_message("assistant"):
        st.markdown(answer)
    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": answer})

# Display FAQ section
st.sidebar.title("FAQ")
st.sidebar.markdown("### Frequently Asked Questions")

# Fetch FAQs from the Flask backend
faqs_response = requests.get("http://127.0.0.1:5002/faq")
if faqs_response.status_code == 200:
    faqs = faqs_response.json()
    for faq in faqs:
        if st.sidebar.button(faq):
            # Send the FAQ question to the Flask backend
            response = requests.post("http://127.0.0.1:5002/ask", json={"question": faq})
            if response.status_code == 200:
                answer = response.json().get("answer", "I'm sorry, I don't have an answer to that question.")
            else:
                answer = "I'm sorry, I encountered an error while processing your request."
            
            # Display the answer in the chat
            with st.chat_message("assistant"):
                st.markdown(answer)
            st.session_state.messages.append({"role": "assistant", "content": answer})
else:
    st.sidebar.markdown("Failed to fetch FAQs.")
