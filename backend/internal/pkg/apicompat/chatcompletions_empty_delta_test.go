package apicompat

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// strptr is a local helper for *string fields.
func strptr(s string) *string { return &s }

// Reproduces the mimo "thinking done, nothing shown" bug: the upstream emits a
// leading {"content":""} chunk (non-nil, empty). The bridge must NOT emit a
// response.output_text.delta for it (the delta would serialize empty and a
// premature message item would be created), and must still stream the real
// content that follows.
func TestChatChunkToResponses_SkipsEmptyContentDelta(t *testing.T) {
	state := NewChatCompletionsToResponsesStreamState("mimo-v2.5")

	// chunk 1: empty content (mimo's leading chunk) — must produce no text delta
	c1 := &ChatCompletionsChunk{
		ID:      "c1",
		Choices: []ChatChunkChoice{{Delta: ChatDelta{Role: "assistant", Content: strptr("")}}},
	}
	ev1 := ChatCompletionsChunkToResponsesEvents(c1, state)
	for _, e := range ev1 {
		assert.NotEqual(t, "response.output_text.delta", e.Type,
			"empty content must not emit an output_text delta")
	}

	// chunk 2: real content — must emit a delta carrying the text
	c2 := &ChatCompletionsChunk{
		ID:      "c1",
		Choices: []ChatChunkChoice{{Delta: ChatDelta{Content: strptr("Hello")}}},
	}
	ev2 := ChatCompletionsChunkToResponsesEvents(c2, state)
	var sawDelta bool
	for _, e := range ev2 {
		if e.Type == "response.output_text.delta" {
			sawDelta = true
			assert.Equal(t, "Hello", e.Delta)
		}
	}
	assert.True(t, sawDelta, "real content must emit an output_text delta")
}

func TestChatChunkToResponses_SkipsEmptyReasoningDelta(t *testing.T) {
	state := NewChatCompletionsToResponsesStreamState("mimo-v2.5")
	c := &ChatCompletionsChunk{
		ID:      "c1",
		Choices: []ChatChunkChoice{{Delta: ChatDelta{ReasoningContent: strptr("")}}},
	}
	ev := ChatCompletionsChunkToResponsesEvents(c, state)
	for _, e := range ev {
		assert.NotEqual(t, "response.reasoning_summary_text.delta", e.Type,
			"empty reasoning_content must not emit a reasoning delta")
	}
}

// Full mimo-shaped stream: empty content → reasoning → real content. The final
// visible text must be exactly the real content, and at least one non-empty
// output_text delta must reach the client.
func TestChatChunkToResponses_MimoShapedStream(t *testing.T) {
	state := NewChatCompletionsToResponsesStreamState("mimo-v2.5")
	chunks := []*ChatCompletionsChunk{
		{ID: "x", Choices: []ChatChunkChoice{{Delta: ChatDelta{Role: "assistant", Content: strptr("")}}}},
		{ID: "x", Choices: []ChatChunkChoice{{Delta: ChatDelta{ReasoningContent: strptr("thinking...")}}}},
		{ID: "x", Choices: []ChatChunkChoice{{Delta: ChatDelta{Content: strptr("Hi")}}}},
		{ID: "x", Choices: []ChatChunkChoice{{Delta: ChatDelta{Content: strptr("!")}}}},
	}
	var textDeltas []string
	for _, c := range chunks {
		for _, e := range ChatCompletionsChunkToResponsesEvents(c, state) {
			if e.Type == "response.output_text.delta" {
				textDeltas = append(textDeltas, e.Delta)
			}
		}
	}
	// every emitted text delta is non-empty
	for _, d := range textDeltas {
		assert.NotEqual(t, "", d)
	}
	assert.Equal(t, "Hi!", strings.Join(textDeltas, ""))
}
