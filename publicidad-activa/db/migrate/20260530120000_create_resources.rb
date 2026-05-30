# frozen_string_literal: true

class CreateResources < ActiveRecord::Migration[8.1]
  def change
    create_table :resources, id: :string do |t|
      t.string :url, null: false
      t.string :materia, null: false
      t.string :materia_label, null: false
      t.string :subtema, null: false
      t.string :subtema_label, null: false
      t.string :tipo
      t.string :organismo_code
      t.string :vigencia, null: false, default: "vigente"
      t.string :periodo
      t.json :path_segments, null: false, default: []
      t.integer :depth, null: false

      t.timestamps
    end

    add_index :resources, :url, unique: true
    add_index :resources, :materia
    add_index :resources, :subtema
    add_index :resources, :organismo_code
    add_index :resources, :vigencia
    add_index :resources, :tipo
    add_index :resources, [ :materia, :subtema ]
    add_index :resources, [ :organismo_code, :tipo, :vigencia ]
  end
end
