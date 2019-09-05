---
what: "Preview"
why: "Access a Prism's focus with possible failure"
section: "Prisms"
title: "Preview"
---

# Preview

`preview` is how we can access a value focused by a Prism while reflecting the
possibility of failure. Note that you can actually use any `Traversal` with
`preview`, but it will only access the first value in the traversal.

You'll often see `preview` used as its infix alias `^?`; preview takes a prism,
traversal, or some composition of optics and returns a `Maybe` of their focus!
If the traversal succeeded (i.e. found at least one element) it'll return `Just`
that element, if the traversal had zero elements the preview fails and
simply returns `Nothing`.

Many prisms focus the contents of a particular constructor of a datatype,
failing if the value doesn't match the constructor. E.g. `_Right` matches
`Right` but not `Left` and focuses the value inside. `_Just` focuses the value
in a `Just` but will fail on a `Nothing`.

Here're a few examples using some prisms and traversals:

```haskell
-- Successfully match the 'Right' constructor
λ> Right 10 ^? _Right
Just 10
-- Fail by using _Left on a 'Right'
λ> Right 10 ^? _Left
Nothing
-- _head is a traversal which matches the 
-- first element of a list-like structure
λ> [1, 2, 3] ^? _head
Just 1
λ> [] ^? _head
Nothing
-- Here we use preview to access the *first* element of a fold
λ> [1, 3, 5] ^? traversed . filtered odd
Just 1
λ> [1, 3, 5] ^? traversed . filtered even
Nothing
-- Here's a deeply nested traversal where we 'dive in' to the 
-- (possibly missing) result of 'at' using '_Just'. 
-- The whole preview succeeds if every piece along the path 
-- succeeds, and fails if any 'match' doesn't work.
λ> M.singleton "key" (M.singleton "nested" "value")  
        ^? at "key" . _Just . at "nested" . _Just
Just "value"
λ> M.singleton "key" (M.singleton "nested" "value")  
        ^? at "missing" . _Just . at "something"
Nothing
```

You can also use prisms as traversals when setting or mutating values, but
similar to traversals they will do nothing if the values they focus don't exist.

```haskell
λ> Left 1 & _Left *~ 100
Left 100
λ> Left 1 & _Right *~ 100
Left 1
λ>  M.fromList [("key", 1), ("otherkey", 5)]  & at "key" . _Just *~ 100
fromList [("key",100),("otherkey",5)]
```

Notice that in the last example given above we can mutate the element at the
key using `_Just`, but can't change its type in the mutation because that
would cause a single element of the Map to have a different type than the
others.

# Pattern Matching

Prisms are useful for representing pattern-matching using combinators rather
than `case`. Unlike syntax constructs for pattern matching they can be passed
to functions, stored in data-structures etc. Here are a few examples of using
`has`, `hasn't` and `isn't` to check the success of pattern matches over some
prisms by returning `True` or `False`:

```haskell
λ> has _Right (Right "Hi")
True
λ> has _Right (Left "Hi")
False
λ> isn't _Empty [1,2,3]
True
λ> isn't _Empty []
False
```

`is` is strangely missing from `lens`, but `has` does the trick just fine;
in fact `has` and `hasn't` seem to be more general than `isn't` in that they
work over all `fold`s and don't require a `Prism`.
