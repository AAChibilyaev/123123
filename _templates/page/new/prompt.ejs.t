---
to: dsl-pages/<%= name %>.yaml
---
page: <%= name %>
route: /<%= name %>
layout: default
seo: { title: "@i18n.<%= name %>.title", description: "@i18n.<%= name %>.desc" }
blocks:
  - use: "@official/hero"
    variant: default
    props:
      title: "@i18n.<%= name %>.hero.title"
      subtitle: "@i18n.<%= name %>.hero.subtitle"
      cta: { label: "@i18n.cta.getStarted", href: "/signup" }
      loading: { component: "@official/spinner", size: "sm" }
localeScope: ["en","ru"]
