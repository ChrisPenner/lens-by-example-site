---
what: "Review"
why: "Prisms may be turned around such that they embed values in a larger structure rather than extracting them"
section: "Prisms"
title: "Review"
---

# Review

Prisms differentiate themselves from simple traversals by allowing you to
**reverse** them and embed a value in a structure. There are a few common uses
for this technique:

- Prisms as ad-hoc constructors/pattern matching
- Composable nested constructors for embedding a value deep inside a structure
- Lifting values (often errors/exceptions) between types

Let's take a peek at how review works with some common _constructor_ prisms.

# Prisms as Constructors

As a convention, prisms which correspond to constructors are named as
`_ConstructorName`; some examples from `Control.Lens.Prism` include `_Left`,
`_Right`, `_Just` and `_Nothing`. Each of these constructors happen to contain
only a single element, which is convenient since review can only embed a single
value, but we'll show a workaround using tuples in a bit. When used as traversals
with `preview` (a.k.a. `^?`) these prisms *unpack* the constructor. E.g.
`_Just` selects the `a` from `Just a` and fails on `Nothing`. `review` (a.k.a.
`#`) on the other hand takes an `a` and embeds it in the constructor such that
`review _Just a = Just a`. Unlike `preview` which may fail to find the value we want,
`review` will always succeed in embedding the value we give it.

Be wary, most but not **all** Prisms are `review`able. Those written by
`makePrisms` are fair game, but when you start writing more advanced prisms
using the `prism` helper with differing `s` and `t` types you may run into
trouble. That's content for another article altogether.

When looking at a `Prism s t a b` type signature the important parts for
`review` are `t` and `b`, the 'simplified' type of `review` is
`review :: Prism' t b -> b -> t`

Here are a few examples constructing values using `#`; the
infix version of `review`:

```haskell
λ>_Just # "hello"
Just "hello"
λ> _Left # 42
Left 42
λ> _Right # Just 1337
Right (Just 1337)
```

Hopefully that's pretty clear! 

Before we move on let's address a common
problem, what do we do in the case where one of our constructors has more than
a single value inside? Not to fret, we can easily pack up our multiple values
into a tuple and use that instead!

# Complex Constructors

Here's an example using `_Cons` from `Control.Lens.Cons`, it allows unpacking a
sequence into the first value of that sequence and the rest of the sequence,
failing if there are no values to split off. This shows us that if we need more
than one value to build up some structure we can just build a prism which
operates over a tuple of those values.

```haskell
λ> [1, 2, 3] ^? _Cons
Just (1, [2, 3])
λ> (1, [2, 3]) # _Cons
[1, 2, 3]
```

This also allows us to represent pattern matching using prisms on more complex
union types! Consider the following type:

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=RegexMatch}
```

Here we have a few constructors for the results of running a
regex match, (not comprehensive I know, don't `@` me). We have a few
interesting cases to examine, `NoMatch` contains **no** fields, `Match`
contains **two** fields, and `Matches` contains a **single** field!

In general you can use `makePrisms` provided by `lens` to write prisms for your
datatypes; but if you want to write your own you can read about that
[here](/articles/prisms/writing-prisms). Let's see what it did for each of
these cases!

If you load them up in ghci and check their type with `:type` you'll see jargon
like:

```haskell
_Match
  :: (Choice p, Applicative f) =>
     p (String, String) (f (String, String))
     -> p RegexMatch (f RegexMatch)
```

These signatures take a bit of practice to read, once you learn to squint
properly and get a bit of practice you can recognize it as:

```haskell
_Match :: Prism' RegexMatch (String, String)
```

If you're unsure of your guess, feel free to punch it back into ghci and see if
it agrees; (ghci _loves_ to contradict you).

```haskell
λ> let x = _Match :: Prism' RegexMatch (String, String)
```

If you get it right ghci will hum along happily, otherwise it'll spit profanity
at you to let you know you've guessed incorrectly.

After a bit of guessing you'll see it generated prisms of the following types for you:

```haskell
_NoMatch :: Prism' RegexMatch ()
_Match :: Prism' RegexMatch (String, String)
_Matches :: Prism' RegexMatch [String]
```

Nothing too special about `_Matches`, it focuses a single thing which is a list
of Strings, we see that `_Match` is a bit more interesting: it packs up the two
values of `Match` into a tuple for us! Lastly is `_NoMatch`, which is a bit
strange. It focuses `()`, meaning it doesn't really extract any real
information for us. What could we use this for? Well for one we can still
construct `NoMatch` using `review` with this prism, which may be helpful just
for consistency reasons (although I'd recommend the actual constructor in most
cases), it's also useful when used with checking functions such as `has`,
`hasn't` or `isn't`, we talk about this in the article on
[preview](/articles/prisms/preview)

# Composing Constructors

Prisms compose! And they act as you might expect! We can compose our various
prisms with `review` and we'll construct a nested object. Take a peek:

```haskell
λ> _Left . _Just # 42
Left (Just 42)
```

This isn't really all that different than composing the constructors themselves
in this case, but it's helpful for consistency, works for more creative
prisms, and when writing things using Classy Prisms as well!

This is particularly helpful when working with error types in real
applications. Oftentimes when composing monad stacks you may need to surface
errors from multiple independent parts of your application. In a simple
application for example it may be possible to get a database error or a network
error. We can represent each distinct class of errors as different types, each
has a few constructors representing different errors which might occur.

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=Errors}
```

If we're using these errors in a real application we'll likely have to unify
them into a single error type so they can be raised in something like an
`ExceptT` monad. We can make a new type to hold either of these error types:

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=AppError}
```

Now that we've got prisms for each error type and for each constructor of the combined `AppError` we can easily
create an `AppError` of the correct type:

```haskell
λ> _ErrorDB . _TransactionFailed # "Contention on User Record"
ErrorDB (TransactionFailed "Contention on User Record")
```

This becomes even more useful if we replace our concrete prisms with 'Classy'
prisms which allow us to write the composition of prisms once and use a single
prism to nest errors as far as needed. That's a topic for another article, but
in the meantime you can watch a [fantastic talk by George
Wilson](https://www.youtube.com/watch?v=GZPup5Iuaqw) about how it works.

# Reviewing Isos

A nifty trick is that Isos can also be reviewed! Since an Iso is *Iso*morphic
to a pair of functions `(a -> b, b -> a)` review on an `Iso a b` corresponds to
running the Iso backwards, i.e. applying the `b -> a` function to the input. Since
you can also view through an Iso forwards we get the equalities:

```haskell
val ^. iso      = from iso # val
val ^. from iso = iso # val
```

Let's write a simple iso to map from chars to integers (this iso is undefined
on certain integers, but it's good enough for teaching purposes):

```{.haskell include=articles/src/Examples/Prisms/Prisms.hs snippet=charing}
```

Using this Iso we can see integers as characters by `view`ing through it, and
can reverse the relationship with `review`!

```haskell
λ> 65 ^. char'ing
'A'
λ> char'ing # 'A'
65
```

If we want to construct the other value with review we can use `from` to
reverse the iso.

```haskell
λ> from char'ing # 65
'A'
```

Isos and prisms are all composable! Here's a useless example where we set a
string field inside a constructor by composing the `reversed` and `packed`
isos with the prism for our constructor! 
```haskell
λ> _TransactionFailed . packed . reversed # ("hello" :: T.Text)
TransactionFailed "olleh"
```

If you have a lot of data mangling to do it can be pretty handy to keep isos
and prisms for your conversions around! Use a prism if the conversion could fail
in one of the directions, and an iso if the round-trip is guaranteed to work!

Here's an example of `_Show :: (Read a, Show a) => Prism' String a` which
`reviews` values through `show` and can `read` values from strings with a
possibility of failure.

```haskell
-- preview:
λ> "72" ^? _Show :: Maybe Int
Just 72
λ> "hrmm?" ^? _Show :: Maybe Int
Nothing
-- review:
λ> _Show # 72
"72"
λ> _Show # [1, 2, 3]
"[1,2,3]"
```
