{-# LANGUAGE TupleSections #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE RankNTypes #-}
module Examples.Prisms.Prisms where
import Numeric.Natural
import Control.Lens
import Data.Functor.Identity
import Data.Char
import qualified Data.Map as M

nat :: Prism' Integer Natural
nat = prism toInteger
  $ \i -> if i < 0 then Left i else Right (fromInteger i)


_Even :: Prism (Identity a) (Identity b) a b
_Even = prism Identity (Right . runIdentity)

_Snd :: (Eq m, Monoid m, Monoid b) => Prism (m, a) (m, b) a b
_Snd = prism
  (mempty, )
  (\(a, b) -> if a == mempty then (Left (mempty, mempty)) else Right b
  )

-- start snippet RegexMatch
data RegexMatch =
      NoMatch              -- regex failed to match
    | Match String String  -- Matched string and remaining string
    | Matches [String]     -- list of matches

makePrisms ''RegexMatch
-- end snippet RegexMatch

-- start snippet Errors
data DatabaseError = NoConnections
                   | DBError String
                   | TransactionFailed String
                   deriving Show
makePrisms ''DatabaseError

data NetworkError = Error500 String
                  | TLSError String
                  deriving Show
makePrisms ''NetworkError
-- end snippet Errors

-- start snippet AppError
data AppError = ErrorDB DatabaseError
              | ErrorNetwork NetworkError
              deriving Show
makePrisms ''AppError
-- end snippet AppError


-- start snippet charing
char'ing :: Iso' Int Char
char'ing = iso chr ord
-- end snippet charing

-- start snippet Validated
data Validated a =
  Validated
    Bool  -- True if the contents have been validated, false otherwise
    a     -- the possibly valid contents
  deriving Show
-- end snippet Validated

-- start snippet _Valid
_Valid :: Prism' (Validated a) a
_Valid = prism' constructor getter
 where
  -- This will be used when our prism is 'reviewed'
  constructor :: a -> Validated a
  constructor a = Validated True a
  -- Get the value if it has been validated, return Nothing otherwise
  getter :: Validated a -> Maybe a
  getter (Validated True  a) = Just a
  getter (Validated False _) = Nothing
-- end snippet _Valid

-- start snippet Validated'
data Validated' invalid valid =
      Valid valid
    | Invalid invalid
    deriving Show
-- end snippet Validated'


-- start snippet _Valid'
_Valid'
  :: Prism
       (Validated' invalid valid)
       (Validated' invalid newValid)
       valid
       newValid
_Valid' = prism constructor getter
 where
  -- This will be used when our prism is 'reviewed'
  constructor :: valid -> Validated' invalid valid
  constructor a = Valid a
  -- Get the value if it has been validated
  -- Otherwise we need to return something something
  -- of the expected result type: `Validated' invalid newValid`
  getter
    :: Validated' invalid valid
    -> Either (Validated' invalid newValid) valid
  getter (Valid   valid  ) = Right valid
  getter (Invalid invalid) = Left (Invalid invalid)
-- end snippet _Valid'
