package schema

import (
	"github.com/Wei-Shaw/sub2api/ent/schema/mixins"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// CodexGroup stores global admin grouping metadata for Codex accounts.
type CodexGroup struct {
	ent.Schema
}

func (CodexGroup) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "codex_groups"},
	}
}

func (CodexGroup) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixins.TimeMixin{},
	}
}

func (CodexGroup) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").
			MaxLen(100).
			NotEmpty().
			Unique(),
		field.String("color").
			MaxLen(32).
			Default("#d97757"),
		field.Int("sort_order").
			Default(0),
	}
}

func (CodexGroup) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("account_metadata", CodexAccountMetadata.Type),
	}
}

func (CodexGroup) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("sort_order", "name"),
	}
}
