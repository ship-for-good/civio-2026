# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_30_140000) do
  create_table "resources", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "depth", null: false
    t.string "materia", null: false
    t.string "materia_label", null: false
    t.string "organismo_code"
    t.string "page_label"
    t.string "page_slug"
    t.json "path_segments", default: [], null: false
    t.string "periodo"
    t.string "subtema", null: false
    t.string "subtema_label", null: false
    t.string "tipo"
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.string "vigencia", default: "vigente", null: false
    t.index ["materia", "subtema"], name: "index_resources_on_materia_and_subtema"
    t.index ["materia"], name: "index_resources_on_materia"
    t.index ["organismo_code", "tipo", "vigencia"], name: "index_resources_on_organismo_code_and_tipo_and_vigencia"
    t.index ["organismo_code"], name: "index_resources_on_organismo_code"
    t.index ["subtema"], name: "index_resources_on_subtema"
    t.index ["tipo"], name: "index_resources_on_tipo"
    t.index ["url"], name: "index_resources_on_url", unique: true
    t.index ["vigencia"], name: "index_resources_on_vigencia"
  end
end
