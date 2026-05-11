package schema

import (
	"github.com/Wei-Shaw/sub2api/ent/schema/mixins"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// CodexAccountMetadata stores local admin metadata keyed by external Codex auth name.
type CodexAccountMetadata struct {
	ent.Schema
}

func (CodexAccountMetadata) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "codex_account_metadata"},
	}
}

func (CodexAccountMetadata) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixins.TimeMixin{},
	}
}

func (CodexAccountMetadata) Fields() []ent.Field {
	return []ent.Field{
		field.String("auth_name").
			MaxLen(255).
			NotEmpty().
			Unique(),
		field.Int64("group_id").
			Optional().
			Nillable(),
		field.String("display_name").
			MaxLen(255).
			Default(""),
		field.String("note").
			Default("").
			SchemaType(map[string]string{dialect.Postgres: "text"}),
		field.JSON("local_tags", []string{}).
			Default([]string{}).
			SchemaType(map[string]string{dialect.Postgres: "jsonb"}),
		field.JSON("settings", map[string]any{}).
			Default(func() map[string]any { return map[string]any{} }).
			SchemaType(map[string]string{dialect.Postgres: "jsonb"}),
		field.Int("sort_order").
			Default(0),
	}
}

func (CodexAccountMetadata) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("group", CodexGroup.Type).
			Ref("account_metadata").
			Field("group_id").
			Unique().
			Annotations(entsql.OnDelete(entsql.SetNull)),
	}
}

func (CodexAccountMetadata) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("group_id"),
		index.Fields("sort_order", "auth_name"),
	}
}
