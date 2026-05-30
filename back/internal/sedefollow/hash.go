package sedefollow

import (
	"crypto/sha256"
	"encoding/hex"
)

func HashBody(body []byte) string {
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}
