package dynamic

import "testing"

func TestNormalizeWorkers(t *testing.T) {
	tests := []struct {
		in   int
		want int
	}{
		{0, 5},
		{-1, 5},
		{3, 3},
		{5, 5},
		{10, 10},
		{20, 10},
	}
	for _, tc := range tests {
		if got := normalizeWorkers(tc.in); got != tc.want {
			t.Errorf("normalizeWorkers(%d) = %d, want %d", tc.in, got, tc.want)
		}
	}
}
