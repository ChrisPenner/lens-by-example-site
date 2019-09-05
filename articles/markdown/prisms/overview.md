---
what: "Prisms"
why: "Optics which encompass access with possible failure"
section: "Prisms"
title: "Overview"
---

# Prisms

Prisms are traversals which focus on a **single** element. That element may or
may not be available; meaning that accessing values with prisms may **succeed**
or **fail** when using something like [preview](/articles/prisms/preview).
Prisms are distinct from traversals however in that they select only a single
element and as a result also have the ability to be **reversed**; meaning you
can give a prism a single value and it will embed it in the same structure
you'd use the prism to access it from! Read more about reversing prisms in the
[review](/articles/prisms/review) article.

`Control.Lens.Prism` contains a few generally useful prisms like `_Just`,
`_Left` and `_Right`, but `lens` also provides the `makePrisms` template
haskell macro for generating prisms for all your own data types! Prisms are
very often used for **pattern-matching**, especially matching on different
data-type constructors! If you use `makePrisms` on a data-type it will generate
a pattern prism for that constructor which which allows you to access the
values inside it *if* the provided value matches the specific constructor of
the data-type. You can reverse these pattern prisms with `review` to have them
act as the constructor they match on! Pretty cool! Learn more about
constructing prisms in the article on [writing
prisms](/articles/prisms/writing-prisms)!
