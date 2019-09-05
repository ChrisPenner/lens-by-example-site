---
what: "Writing Prisms"
why: "Prisms represent the concept of a traversal which may fail, preview represents access with failure"
section: "Prisms"
title: "Writing Prisms"
---

# Writing Prisms

Although you can write prisms for any potentially failing access oftentimes
prisms correspond to data constructors. For this purpose we can use
`TemplateHaskell` to generate prisms for our data types.

# Template Haskell

Here's a simple data-type representing a few possible results from running a
regex match.

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=RegexMatch}
```

The last line using `makeLenses` will generate a prism for each of our
constructors (you'll need the `TemplateHaskell` language pragma though). When
constructors have more than one value the generated prisms pack the values up
into tuples and use those, if there are no contained values the prism simply
uses `()` as a stand-in. The actual type signatures are a bit messier (as is
tradition for the lens library), but the simplified signatures for our
`RegexMatch` prisms look like this:

```haskell
_NoMatch :: Prism' RegexMatch ()
_Match :: Prism' RegexMatch (String, String)
_Matches :: Prism' RegexMatch [String]
```

Notice that each of these are simple prisms (`Prism'` rather than `Prism`).
This is because the prism can't change the **type** of its focus in this case;
it's hard-coded to be a string. Each of these prisms is reversable with review;
read about how to do that [here](/articles/prisms/review).

# Constructing Prisms

In the case where you want a more complex prism than
Template Haskell can generate for you, the `lens` library provides
`prism` and `prism'` helper functions for writing your own!

Similar to the `Prism` and `Prism'` type synonyms, `prism'` can construct
simple prisms which do not allow the larger structure to change types although
the focus of the prism may change types provided you have some way to map it
back to the same `s` type. With that single exception you'll probably use
`prism'` to generate a `Prism'` and `prism` to make a `Prism`!

For an example we'll write a strange type which represents
some value which may or may not have been validated yet:

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=Validated}
```

Now let's write a prism which focuses the contained value if and only if the
it has been validated already! To do so we pass `prism'` two
functions: one which embeds a value at the focus of a larger context, and
the other which gets the focus out of the larger structure or fail.

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=_Valid}
```

Here we're using `prism'` so we know we get a `Prism'`, in this case one
between the larger structure and the focused value.

Let's try it out!

```haskell
-- Constructing with 'review'
λ> _Valid # "test@example.com"
Validated True "test@example.com"

-- Accessing a validated value
λ> Validated True "me@chrispenner.ca" ^? _Valid
Just "me@chrispenner.ca"

-- Failing to access an unvalidated value
λ> Validated False  "spam@shadytown" ^? _Valid
Nothing
```

We should also quickly test that we pass the prism laws, there are two!

The first states that if we `preview` something that we've `review`ed we should
get the same thing back (in a `Just`)

```haskell
preview _Valid (review _Valid b) ≡ Just b

-- Let's try it!
λ> preview _Valid (review _Valid 42)
Just 42
```

Secondly if we preview a lens on a value and get a `Just`, then reviewing that
`a` should get us a value exactly equal to the original.

More succinctly: If `preview l s ≡ Just a` then `review l a ≡ s`

Let's try that:

```haskell
λ> preview _Valid (Validated True "brucewayne@example.com")
Just "brucewayne@example.com"
λ> review _Valid "brucewayne@example.com"
Validated True "brucewayne@example.com"
```

Great! Looks like we're passing both prism laws, at least for the simple cases
we've tried. This ensures that if we use our prism with combinators in the
`lens` library that things will behave as expected.

It seems at first glance that we should be able to allow our `_Valid` lens to
change the type of the value contained inside right? Perhaps to allow us to do
something like the following:

```haskell
λ> Validated True 42 & _Valid %~ show
-- We want the following, but actually fail with a type error:
Validated True "42"
```

So let's see if this is something we can do if we upgrade to `prism`!

The difference from `prism'` to `prism` is in the 'getter' function, the
`prism'` version returns `Just` the value or `Nothing`, the type-changing
version used in `prism` must be able to construct some base value of the new
base type even in the failing case; and so instead of `getter :: s -> Maybe a`
we now have `getter: s -> Either t a`. That is, we return `Right focus` if the
focus exists, or a `Left` of some structure of the new type otherwise. If we
try using this for our type we run into a problem!

```haskell
_Valid' :: forall a b. Prism (Validated a) (Validated b) a b
_Valid' = prism constructor getter
 where
  constructor :: a -> Validated a
  constructor a = Validated True a
  getter :: Validated a -> Either (Validated b) a
  getter (Validated isValid a) = 
  if isValid 
    then Right a
    -- WHOOPS! We need something of type b, but don't have anything!
    else Left (Validated isValid ???) 
```

In our case we'll always have something of type `a`, but only want to edit it
when it's valid. This works with the simple prism, but if we want to allow type
changing we need to fix this issue by making the types of our valid and invalid
values distinct.

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=Validated'}
```

Now we have separate constructors and we can vary the types of valid and
invalid data separately. Now let's write our prism again!

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=_Valid'}
```

That'll do it! Now we can change the type contained in our `Validated'` type
using a prism:

```haskell
λ> Valid 42 & _Valid' %~ show
Valid "42"
```

Keen observers will realize that we actually just rewrote `Either` but with a
new name! What can I say? 🙈

That wraps writing simple Prisms!

