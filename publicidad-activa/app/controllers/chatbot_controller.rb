# frozen_string_literal: true

require "net/http"
require "json"

class ChatbotController < ApplicationController
  FLASK_BASE      = URI(ENV.fetch("CHATBOT_URL", "http://localhost:5002"))
  CONNECT_TIMEOUT = 3   # fail fast when Flask is not running
  READ_TIMEOUT    = 30  # Mistral RAG calls can take 8-15 s

  def ask
    question = params.require(:question)
    render json: { answer: flask_post("/ask", { question: question }) }
  rescue ActionController::ParameterMissing
    render json: { answer: "Por favor, escribe una pregunta." }
  end

  def faq
    render json: flask_get("/faq")
  end

  private

  def flask_post(path, body)
    uri        = build_uri(path)
    http       = build_http(uri)
    request    = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
    request.body = body.to_json

    response = http.request(request)
    JSON.parse(response.body).fetch("answer", flask_error_message)
  rescue *flask_errors => e
    Rails.logger.warn("[ChatbotController] Flask unreachable: #{e.class} — #{e.message}")
    flask_error_message
  end

  def flask_get(path)
    uri      = build_uri(path)
    http     = build_http(uri)
    response = http.request(Net::HTTP::Get.new(uri))
    JSON.parse(response.body)
  rescue *flask_errors => e
    Rails.logger.warn("[ChatbotController] Flask FAQ unreachable: #{e.class} — #{e.message}")
    []
  end

  def build_uri(path)
    uri      = FLASK_BASE.dup
    uri.path = path
    uri
  end

  def build_http(uri)
    http              = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = CONNECT_TIMEOUT
    http.read_timeout = READ_TIMEOUT
    http.use_ssl      = uri.scheme == "https"
    http
  end

  def flask_errors
    [Errno::ECONNREFUSED, Errno::ETIMEDOUT, Net::OpenTimeout, Net::ReadTimeout,
     SocketError, JSON::ParserError]
  end

  def flask_error_message
    "Lo siento, el asistente no está disponible en este momento. Por favor, inténtalo más tarde."
  end
end
