# frozen_string_literal: true

require "test_helper"

class ErrorsControllerTest < ActionDispatch::IntegrationTest
  test "unknown path returns 404 page" do
    get "/ruta-que-no-existe"

    assert_response :not_found
    assert_match "Página no encontrada", response.body
    assert_match "Ir al inicio", response.body
  end

  test "invalid organism subtema returns 404 page" do
    get "/organisms/INEXISTENTE/materia-inexistente/subtema-inexistente"

    assert_response :not_found
    assert_match "Página no encontrada", response.body
  end
end
