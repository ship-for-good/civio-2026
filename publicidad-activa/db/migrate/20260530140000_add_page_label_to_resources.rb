# frozen_string_literal: true

class AddPageLabelToResources < ActiveRecord::Migration[8.1]
  def change
    add_column :resources, :page_slug, :string
    add_column :resources, :page_label, :string
  end
end
