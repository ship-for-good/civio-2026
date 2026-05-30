package llm

import "testing"

func TestParseVerification_match(t *testing.T) {
	matched, msg, err := parseVerification("VEREDICTO: SI\nMENSAJE: ok")
	if err != nil {
		t.Fatal(err)
	}
	if !matched {
		t.Fatal("matched = false, want true")
	}
	if msg != "" {
		t.Errorf("message = %q, want empty", msg)
	}
}

func TestParseVerification_noMatch(t *testing.T) {
	matched, msg, err := parseVerification("VEREDICTO: NO\nMENSAJE: No trata sobre retribuciones.")
	if err != nil {
		t.Fatal(err)
	}
	if matched {
		t.Fatal("matched = true, want false")
	}
	if msg != "No trata sobre retribuciones." {
		t.Errorf("message = %q", msg)
	}
}
