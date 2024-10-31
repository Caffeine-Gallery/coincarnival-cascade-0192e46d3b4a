export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getHighScore' : IDL.Func([], [IDL.Nat], ['query']),
    'resetGame' : IDL.Func([], [], []),
    'updateHighScore' : IDL.Func([IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
