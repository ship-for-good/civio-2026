# frozen_string_literal: true

require "test_helper"

class Resources::Services::LoadIndexTest < ActiveSupport::TestCase
  test "loads totals and featured organisms from publicidad-activa-index.json" do
    result = Resources::Services::LoadIndex.call

    assert result.total.positive?
    assert result.organism_counts.values.sum.positive?
    assert_equal 12, result.featured_organisms.size

    featured = result.featured_organisms.first
    assert featured.code.present?
    assert featured.count.positive?
    assert featured.description.present?
  end
end
