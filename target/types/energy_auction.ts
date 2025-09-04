/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/energy_auction.json`.
 */
export type EnergyAuction = {
  "address": "5jcCqhVXRebbuCMVeRtm18FQiNiWUrQBdxkevyCWLCE7",
  "metadata": {
    "name": "energyAuction",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "appealSlashing",
      "docs": [
        "Appeal a slashing decision"
      ],
      "discriminator": [
        137,
        188,
        82,
        135,
        10,
        74,
        128,
        202
      ],
      "accounts": [
        {
          "name": "slashingState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "slashing_state.timeslot",
                "account": "slashingState"
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "appealEvidence",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "calculateBuyerAllocations",
      "docs": [
        "Calculate buyer allocations from multiple sellers in merit order"
      ],
      "discriminator": [
        117,
        154,
        8,
        212,
        133,
        199,
        0,
        134
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "buyerAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "arg",
                "path": "buyerKey"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "buyerKey",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "calculateSellerAllocations",
      "discriminator": [
        152,
        41,
        231,
        171,
        139,
        6,
        23,
        8
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "supply",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  112,
                  108,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "supply.supplier",
                "account": "supply"
              }
            ]
          }
        },
        {
          "name": "sellerAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "supply.supplier",
                "account": "supply"
              }
            ]
          }
        },
        {
          "name": "remainingAllocationTracker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "clearingPrice",
          "type": "u64"
        },
        {
          "name": "totalSoldQuantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelAuction",
      "docs": [
        "Cancel auction in case of failure or emergency"
      ],
      "discriminator": [
        156,
        43,
        197,
        110,
        218,
        105,
        143,
        182
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "commitSupply",
      "docs": [
        "Seller commits supply (one-time per (global_state, timeslot, seller))",
        "Escrows seller's energy tokens into a program-owned vault (authority = timeslot PDA)"
      ],
      "discriminator": [
        27,
        99,
        221,
        158,
        123,
        73,
        174,
        98
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "timeslotEpoch"
              }
            ]
          }
        },
        {
          "name": "supply",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  112,
                  108,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "energyMint"
        },
        {
          "name": "sellerSource",
          "writable": true
        },
        {
          "name": "sellerEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "timeslotEpoch",
          "type": "i64"
        },
        {
          "name": "reservePrice",
          "type": "u64"
        },
        {
          "name": "quantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createFillReceipt",
      "docs": [
        "2. Create Fill Receipt: Authority creates a receipt for each winning buyer."
      ],
      "discriminator": [
        87,
        197,
        138,
        119,
        136,
        216,
        227,
        137
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "buyer"
        },
        {
          "name": "fillReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  105,
                  108,
                  108,
                  95,
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "quantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emergencyPause",
      "docs": [
        "Emergency pause the protocol"
      ],
      "discriminator": [
        21,
        143,
        27,
        142,
        200,
        181,
        210,
        255
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "emergencyState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  101,
                  114,
                  103,
                  101,
                  110,
                  99,
                  121,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "emergencyResume",
      "docs": [
        "Resume protocol after emergency pause"
      ],
      "discriminator": [
        0,
        243,
        48,
        185,
        6,
        73,
        190,
        83
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "emergencyState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  101,
                  114,
                  103,
                  101,
                  110,
                  99,
                  121,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "emergencyWithdraw",
      "docs": [
        "Emergency withdrawal for stuck funds with comprehensive validation"
      ],
      "discriminator": [
        239,
        45,
        203,
        64,
        150,
        73,
        218,
        92
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "sourceAccount",
          "writable": true
        },
        {
          "name": "destinationAccount",
          "writable": true
        },
        {
          "name": "emergencyState"
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "withdrawalType",
          "type": {
            "defined": {
              "name": "emergencyWithdrawalType"
            }
          }
        }
      ]
    },
    {
      "name": "executeAuctionClearing",
      "docs": [
        "Execute the auction clearing algorithm to determine the final price and quantity",
        "This is the core of the auction mechanism that finds the intersection of supply and demand"
      ],
      "discriminator": [
        32,
        184,
        16,
        30,
        202,
        150,
        34,
        93
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "executeProposal",
      "docs": [
        "Execute approved governance proposal with multi-signature validation"
      ],
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "governanceProposal"
              }
            ]
          }
        },
        {
          "name": "globalState",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "executeSlashing",
      "docs": [
        "Execute slashing penalties after appeal period with comprehensive validation"
      ],
      "discriminator": [
        161,
        194,
        131,
        169,
        220,
        60,
        7,
        232
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "slashingState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "slashing_state.supplier",
                "account": "slashingState"
              }
            ]
          }
        },
        {
          "name": "sellerCollateral",
          "writable": true
        },
        {
          "name": "slashingVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "sellerAllocation"
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initAllocationTracker",
      "discriminator": [
        199,
        77,
        89,
        167,
        143,
        236,
        81,
        75
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "allocationTracker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initBidRegistry",
      "docs": [
        "Initialize bid registry for a timeslot"
      ],
      "discriminator": [
        67,
        27,
        217,
        123,
        13,
        9,
        93,
        249
      ],
      "accounts": [
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "bidRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the global protocol state"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "globalState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "quoteMint",
          "docs": [
            "Quote token mint (e.g., USDC)"
          ]
        },
        {
          "name": "feeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        },
        {
          "name": "version",
          "type": "u8"
        }
      ]
    },
    {
      "name": "openTimeslot",
      "docs": [
        "Open a new auction timeslot"
      ],
      "discriminator": [
        100,
        104,
        113,
        222,
        56,
        109,
        141,
        151
      ],
      "accounts": [
        {
          "name": "globalState",
          "writable": true
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "epochTs"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochTs",
          "type": "i64"
        },
        {
          "name": "lotSize",
          "type": "u64"
        },
        {
          "name": "priceTick",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placeBid",
      "docs": [
        "Buyer places bid, escrows quote tokens (USDC) into a program-owned vault (authority = timeslot PDA)"
      ],
      "discriminator": [
        238,
        77,
        148,
        91,
        200,
        151,
        92,
        146
      ],
      "accounts": [
        {
          "name": "globalState",
          "writable": true
        },
        {
          "name": "timeslot",
          "writable": true
        },
        {
          "name": "timeslotQuoteEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "quoteMint"
        },
        {
          "name": "buyerSource",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidPage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "arg",
                "path": "pageIndex"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "pageIndex",
          "type": "u32"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "quantity",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "processBidBatch",
      "docs": [
        "Process a batch of bids for auction clearing",
        "This instruction processes bids from multiple pages and aggregates them by price level"
      ],
      "discriminator": [
        180,
        218,
        167,
        11,
        129,
        12,
        127,
        123
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "priceLevel",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "startPage",
          "type": "u32"
        },
        {
          "name": "endPage",
          "type": "u32"
        }
      ],
      "returns": {
        "defined": {
          "name": "batchResult"
        }
      }
    },
    {
      "name": "processSupplyBatch",
      "docs": [
        "Process a batch of supply commitments for auction clearing",
        "This instruction processes supply from multiple sellers and sorts them by reserve price"
      ],
      "discriminator": [
        117,
        81,
        11,
        210,
        242,
        246,
        173,
        234
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "allocationTracker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "supplierKeys",
          "type": {
            "vec": "pubkey"
          }
        }
      ],
      "returns": {
        "defined": {
          "name": "supplyAllocationResult"
        }
      }
    },
    {
      "name": "proposeParameterChange",
      "docs": [
        "Propose parameter change through governance with enhanced validation"
      ],
      "discriminator": [
        177,
        33,
        9,
        169,
        8,
        70,
        78,
        151
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposerStake",
          "docs": [
            "Token account representing proposer's stake"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "proposalType",
          "type": {
            "defined": {
              "name": "proposalType"
            }
          }
        },
        {
          "name": "newValue",
          "type": "u64"
        },
        {
          "name": "description",
          "type": {
            "array": [
              "u8",
              128
            ]
          }
        }
      ]
    },
    {
      "name": "redeemEnergyAndRefund",
      "docs": [
        "4. Redeem Energy & Refund: Buyer claims their won energy and gets a refund for over-bids."
      ],
      "discriminator": [
        163,
        71,
        159,
        32,
        82,
        75,
        214,
        0
      ],
      "accounts": [
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "buyerAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "timeslotQuoteEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "buyerQuoteAta",
          "writable": true
        },
        {
          "name": "buyerEnergyAta",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "refundCancelledAuctionBuyers",
      "docs": [
        "Refund buyers after auction cancellation"
      ],
      "discriminator": [
        200,
        255,
        10,
        233,
        170,
        63,
        208,
        155
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "cancellationState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  110,
                  99,
                  101,
                  108,
                  108,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "timeslotQuoteEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "startPage",
          "type": "u32"
        },
        {
          "name": "endPage",
          "type": "u32"
        }
      ],
      "returns": {
        "defined": {
          "name": "refundBatchResult"
        }
      }
    },
    {
      "name": "refundCancelledAuctionSellers",
      "docs": [
        "Refund sellers after auction cancellation"
      ],
      "discriminator": [
        141,
        81,
        230,
        89,
        150,
        163,
        11,
        175
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "cancellationState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  110,
                  99,
                  101,
                  108,
                  108,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "sellerKeys",
          "type": {
            "vec": "pubkey"
          }
        }
      ],
      "returns": {
        "defined": {
          "name": "refundBatchResult"
        }
      }
    },
    {
      "name": "registerBidPage",
      "docs": [
        "Register a bid page in the bid registry"
      ],
      "discriminator": [
        246,
        165,
        196,
        48,
        187,
        240,
        12,
        26
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "bidRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "bidPage",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100,
                  95,
                  112,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "arg",
                "path": "pageIndex"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "pageIndex",
          "type": "u32"
        }
      ]
    },
    {
      "name": "registerSeller",
      "docs": [
        "Register seller in the seller registry for efficient lookup"
      ],
      "discriminator": [
        9,
        50,
        144,
        162,
        206,
        176,
        154,
        111
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "sellerRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "reportNonDelivery",
      "docs": [
        "Report non-delivery by a seller"
      ],
      "discriminator": [
        215,
        237,
        197,
        139,
        183,
        241,
        28,
        61
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "sellerAllocation",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "seller_allocation.supplier",
                "account": "sellerAllocation"
              }
            ]
          }
        },
        {
          "name": "slashingState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "seller_allocation.supplier",
                "account": "sellerAllocation"
              }
            ]
          }
        },
        {
          "name": "reporter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "deliveredQuantity",
          "type": "u64"
        },
        {
          "name": "evidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "resolveSlashingAppeal",
      "docs": [
        "Appeal resolution system with evidence validation"
      ],
      "discriminator": [
        18,
        67,
        217,
        26,
        32,
        10,
        217,
        60
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "slashingState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "slashing_state.supplier",
                "account": "slashingState"
              }
            ]
          }
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "sellerCollateral",
          "writable": true
        },
        {
          "name": "slashingVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "decision",
          "type": {
            "defined": {
              "name": "appealDecision"
            }
          }
        },
        {
          "name": "resolutionEvidence",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "rollbackFailedAuction",
      "docs": [
        "Rollback failed auction to previous state"
      ],
      "discriminator": [
        101,
        247,
        143,
        229,
        185,
        139,
        222,
        198
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "sealTimeslot",
      "docs": [
        "Seal a timeslot (freeze order flow)"
      ],
      "discriminator": [
        30,
        186,
        196,
        57,
        64,
        117,
        138,
        41
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "settleTimeslot",
      "docs": [
        "1. Settle Timeslot: Authority sets the final clearing price and sold quantity.",
        "This instruction only records the outcome; it does not move funds."
      ],
      "discriminator": [
        100,
        213,
        28,
        54,
        29,
        49,
        70,
        164
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "clearingPrice",
          "type": "u64"
        },
        {
          "name": "totalSoldQuantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "validateSystemHealth",
      "docs": [
        "Add comprehensive input validation and circuit breaker"
      ],
      "discriminator": [
        47,
        63,
        203,
        82,
        218,
        218,
        28,
        201
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "emergencyState"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "systemHealthReport"
        }
      }
    },
    {
      "name": "verifyAuctionClearing",
      "docs": [
        "Verify the mathematical correctness of the auction clearing",
        "This ensures that the auction results satisfy all required properties"
      ],
      "discriminator": [
        197,
        95,
        119,
        183,
        175,
        151,
        125,
        80
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "auctionState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "timeslotQuoteEscrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "verifyDeliveryConfirmation",
      "docs": [
        "Verify delivery confirmation from oracle with automated penalty triggers"
      ],
      "discriminator": [
        192,
        88,
        211,
        8,
        208,
        168,
        75,
        99
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "slashingState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "supplier"
              }
            ]
          }
        },
        {
          "name": "supplier"
        },
        {
          "name": "sellerAllocation"
        },
        {
          "name": "oracle"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "deliveryReport",
          "type": {
            "defined": {
              "name": "deliveryReport"
            }
          }
        },
        {
          "name": "oracleSignature",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "voteOnProposal",
      "docs": [
        "Vote on a governance proposal with multi-signature support"
      ],
      "discriminator": [
        188,
        239,
        13,
        88,
        119,
        199,
        251,
        119
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "governanceProposal"
              }
            ]
          }
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "voterStake",
          "docs": [
            "Token account representing voter's stake"
          ]
        },
        {
          "name": "globalState"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "vote",
          "type": {
            "defined": {
              "name": "vote"
            }
          }
        },
        {
          "name": "votingPower",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawProceeds",
      "docs": [
        "3. Withdraw Proceeds: Seller claims their earnings.",
        "This instruction calculates the fee, sends it to the vault, and sends the net proceeds to the seller."
      ],
      "discriminator": [
        124,
        68,
        215,
        12,
        201,
        136,
        54,
        72
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "supply",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  112,
                  108,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "timeslotQuoteEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "feeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "sellerProceedsAta",
          "writable": true
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawProceedsV2",
      "discriminator": [
        240,
        85,
        198,
        113,
        97,
        46,
        170,
        131
      ],
      "accounts": [
        {
          "name": "globalState"
        },
        {
          "name": "timeslot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  109,
                  101,
                  115,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "timeslot.epoch_ts",
                "account": "timeslot"
              }
            ]
          }
        },
        {
          "name": "sellerAllocation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  97,
                  108,
                  108,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "timeslotQuoteEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  116,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "timeslot"
              }
            ]
          }
        },
        {
          "name": "feeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "sellerProceedsAta",
          "writable": true
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "allocationTracker",
      "discriminator": [
        135,
        193,
        135,
        1,
        212,
        107,
        152,
        187
      ]
    },
    {
      "name": "auctionState",
      "discriminator": [
        252,
        227,
        205,
        147,
        72,
        64,
        250,
        126
      ]
    },
    {
      "name": "bidPage",
      "discriminator": [
        158,
        173,
        229,
        198,
        84,
        158,
        181,
        44
      ]
    },
    {
      "name": "bidRegistry",
      "discriminator": [
        221,
        229,
        225,
        182,
        190,
        33,
        201,
        197
      ]
    },
    {
      "name": "buyerAllocation",
      "discriminator": [
        148,
        89,
        196,
        215,
        127,
        26,
        55,
        249
      ]
    },
    {
      "name": "cancellationState",
      "discriminator": [
        108,
        114,
        178,
        47,
        128,
        234,
        94,
        174
      ]
    },
    {
      "name": "emergencyState",
      "discriminator": [
        180,
        65,
        56,
        35,
        62,
        185,
        148,
        179
      ]
    },
    {
      "name": "fillReceipt",
      "discriminator": [
        8,
        10,
        169,
        84,
        163,
        19,
        167,
        139
      ]
    },
    {
      "name": "globalState",
      "discriminator": [
        163,
        46,
        74,
        168,
        216,
        123,
        133,
        98
      ]
    },
    {
      "name": "governanceProposal",
      "discriminator": [
        53,
        107,
        240,
        190,
        43,
        73,
        65,
        143
      ]
    },
    {
      "name": "priceLevelAggregate",
      "discriminator": [
        153,
        95,
        194,
        114,
        77,
        98,
        140,
        149
      ]
    },
    {
      "name": "sellerAllocation",
      "discriminator": [
        131,
        110,
        254,
        106,
        98,
        207,
        114,
        19
      ]
    },
    {
      "name": "sellerRegistry",
      "discriminator": [
        124,
        54,
        41,
        237,
        146,
        167,
        132,
        60
      ]
    },
    {
      "name": "slashingState",
      "discriminator": [
        221,
        142,
        163,
        11,
        226,
        102,
        243,
        67
      ]
    },
    {
      "name": "supply",
      "discriminator": [
        171,
        89,
        187,
        81,
        56,
        72,
        108,
        218
      ]
    },
    {
      "name": "timeslot",
      "discriminator": [
        38,
        119,
        100,
        134,
        8,
        113,
        71,
        156
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    }
  ],
  "events": [
    {
      "name": "auctionCancelled",
      "discriminator": [
        22,
        32,
        51,
        83,
        215,
        194,
        171,
        209
      ]
    },
    {
      "name": "auctionCleared",
      "discriminator": [
        14,
        162,
        105,
        210,
        219,
        36,
        142,
        160
      ]
    },
    {
      "name": "auctionRolledBack",
      "discriminator": [
        172,
        32,
        97,
        169,
        57,
        129,
        221,
        198
      ]
    },
    {
      "name": "auctionVerified",
      "discriminator": [
        218,
        146,
        254,
        79,
        30,
        12,
        140,
        252
      ]
    },
    {
      "name": "autoSlashingTriggered",
      "discriminator": [
        50,
        247,
        97,
        31,
        58,
        235,
        164,
        123
      ]
    },
    {
      "name": "bidBatchProcessed",
      "discriminator": [
        126,
        71,
        31,
        67,
        186,
        45,
        217,
        201
      ]
    },
    {
      "name": "bidOutcomeCreated",
      "discriminator": [
        140,
        20,
        73,
        131,
        160,
        218,
        64,
        143
      ]
    },
    {
      "name": "buyersRefunded",
      "discriminator": [
        238,
        216,
        242,
        93,
        191,
        109,
        102,
        234
      ]
    },
    {
      "name": "circuitBreakerTriggered",
      "discriminator": [
        58,
        7,
        35,
        109,
        165,
        114,
        119,
        58
      ]
    },
    {
      "name": "deliveryVerified",
      "discriminator": [
        241,
        142,
        183,
        123,
        105,
        238,
        231,
        132
      ]
    },
    {
      "name": "emergencyPaused",
      "discriminator": [
        97,
        135,
        220,
        149,
        143,
        72,
        9,
        27
      ]
    },
    {
      "name": "emergencyResumed",
      "discriminator": [
        36,
        176,
        144,
        117,
        139,
        3,
        190,
        227
      ]
    },
    {
      "name": "emergencyWithdrawal",
      "discriminator": [
        225,
        77,
        96,
        117,
        149,
        211,
        83,
        71
      ]
    },
    {
      "name": "energyRedeemed",
      "discriminator": [
        149,
        116,
        160,
        163,
        245,
        163,
        24,
        139
      ]
    },
    {
      "name": "nonDeliveryReported",
      "discriminator": [
        101,
        8,
        15,
        131,
        216,
        163,
        253,
        215
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    },
    {
      "name": "proposalExecuted",
      "discriminator": [
        92,
        213,
        189,
        201,
        101,
        83,
        111,
        83
      ]
    },
    {
      "name": "proposalPassed",
      "discriminator": [
        220,
        78,
        169,
        5,
        10,
        162,
        76,
        114
      ]
    },
    {
      "name": "sellerAllocationNeeded",
      "discriminator": [
        156,
        190,
        189,
        23,
        86,
        159,
        241,
        202
      ]
    },
    {
      "name": "sellersRefunded",
      "discriminator": [
        93,
        208,
        179,
        35,
        8,
        101,
        5,
        63
      ]
    },
    {
      "name": "slashingAppealRejected",
      "discriminator": [
        192,
        180,
        19,
        61,
        201,
        178,
        152,
        6
      ]
    },
    {
      "name": "slashingAppealUpheld",
      "discriminator": [
        46,
        168,
        117,
        187,
        255,
        72,
        60,
        171
      ]
    },
    {
      "name": "slashingAppealed",
      "discriminator": [
        40,
        35,
        123,
        102,
        1,
        153,
        139,
        77
      ]
    },
    {
      "name": "slashingExecuted",
      "discriminator": [
        61,
        246,
        49,
        117,
        235,
        117,
        73,
        89
      ]
    },
    {
      "name": "supplyBatchProcessed",
      "discriminator": [
        145,
        122,
        95,
        234,
        36,
        90,
        7,
        34
      ]
    },
    {
      "name": "supplyCommitted",
      "discriminator": [
        12,
        9,
        183,
        239,
        147,
        121,
        161,
        140
      ]
    },
    {
      "name": "voteCast",
      "discriminator": [
        39,
        53,
        195,
        104,
        188,
        17,
        225,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAuthority",
      "msg": "Invalid authority for this operation"
    },
    {
      "code": 6001,
      "name": "duplicateSupply",
      "msg": "Supply already committed for this seller and timeslot"
    },
    {
      "code": 6002,
      "name": "invalidTimeslot",
      "msg": "Timeslot is not in the correct state for this operation"
    },
    {
      "code": 6003,
      "name": "insufficientBalance",
      "msg": "Insufficient token balance to commit supply"
    },
    {
      "code": 6004,
      "name": "mathError",
      "msg": "Math overflow/underflow error"
    },
    {
      "code": 6005,
      "name": "invalidEscrowVault",
      "msg": "Invalid escrow vault account"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "Unauthorized signer for this transaction"
    },
    {
      "code": 6007,
      "name": "invalidGlobalState",
      "msg": "Invalid global state account provided"
    },
    {
      "code": 6008,
      "name": "constraintViolation",
      "msg": "Account constraint violated"
    },
    {
      "code": 6009,
      "name": "alreadyClaimed",
      "msg": "Proceeds or refund have already been claimed"
    },
    {
      "code": 6010,
      "name": "reservePriceNotMet",
      "msg": "Seller's reserve price not met by clearing price"
    },
    {
      "code": 6011,
      "name": "allocationExhausted",
      "msg": "No more quantity available for allocation"
    },
    {
      "code": 6012,
      "name": "invalidMeritOrder",
      "msg": "Suppliers must be processed in merit order by reserve price"
    },
    {
      "code": 6013,
      "name": "noMarketClearing",
      "msg": "No market clearing possible - all reserve prices exceed highest bid"
    },
    {
      "code": 6014,
      "name": "computationLimitExceeded",
      "msg": "Auction clearing computation limit exceeded"
    },
    {
      "code": 6015,
      "name": "auctionInProgress",
      "msg": "Auction already in progress"
    },
    {
      "code": 6016,
      "name": "auctionClearingFailed",
      "msg": "Auction clearing failed"
    },
    {
      "code": 6017,
      "name": "invalidBidPageSequence",
      "msg": "Invalid bid page sequence"
    },
    {
      "code": 6018,
      "name": "insufficientDemand",
      "msg": "Insufficient demand for clearing"
    },
    {
      "code": 6019,
      "name": "insufficientSupply",
      "msg": "Insufficient supply for clearing"
    },
    {
      "code": 6020,
      "name": "settlementVerificationFailed",
      "msg": "Settlement verification failed"
    },
    {
      "code": 6021,
      "name": "escrowMismatch",
      "msg": "Escrow balance mismatch"
    },
    {
      "code": 6022,
      "name": "precisionError",
      "msg": "Precision error in quantity allocation"
    },
    {
      "code": 6023,
      "name": "batchProcessingError",
      "msg": "Batch processing error"
    },
    {
      "code": 6024,
      "name": "invalidSupplierKeys",
      "msg": "Invalid supplier keys provided"
    },
    {
      "code": 6025,
      "name": "noIntersection",
      "msg": "No intersection found between supply and demand"
    },
    {
      "code": 6026,
      "name": "insufficientAccountSpace",
      "msg": "Insufficient account space for allocation"
    },
    {
      "code": 6027,
      "name": "missingSellerAllocationAccount",
      "msg": "Missing seller allocation account"
    },
    {
      "code": 6028,
      "name": "cancellationInProgress",
      "msg": "Auction cancellation in progress"
    },
    {
      "code": 6029,
      "name": "deliveryVerificationFailed",
      "msg": "Delivery verification failed"
    },
    {
      "code": 6030,
      "name": "slashingAppealExpired",
      "msg": "Slashing appeal period expired"
    },
    {
      "code": 6031,
      "name": "emergencyPauseActive",
      "msg": "Emergency pause is active"
    },
    {
      "code": 6032,
      "name": "proposalVotingExpired",
      "msg": "Proposal voting period expired"
    },
    {
      "code": 6033,
      "name": "insufficientVotingPower",
      "msg": "Insufficient voting power"
    },
    {
      "code": 6034,
      "name": "parameterOutOfBounds",
      "msg": "Parameter value out of bounds"
    },
    {
      "code": 6035,
      "name": "emergencyPauseRequired",
      "msg": "Emergency pause required for this operation"
    },
    {
      "code": 6036,
      "name": "insufficientUpgradeAccounts",
      "msg": "Insufficient upgrade accounts provided"
    },
    {
      "code": 6037,
      "name": "insufficientStake",
      "msg": "Insufficient stake for this operation"
    },
    {
      "code": 6038,
      "name": "proposalNotPassed",
      "msg": "Proposal has not passed"
    },
    {
      "code": 6039,
      "name": "timelockNotExpired",
      "msg": "Timelock period has not expired"
    },
    {
      "code": 6040,
      "name": "insufficientSignatures",
      "msg": "Insufficient signatures for execution"
    },
    {
      "code": 6041,
      "name": "insufficientTimeElapsed",
      "msg": "Insufficient time elapsed for this operation"
    },
    {
      "code": 6042,
      "name": "deliveryWindowExpired",
      "msg": "Delivery window has expired"
    },
    {
      "code": 6043,
      "name": "unauthorizedOracle",
      "msg": "Unauthorized oracle"
    },
    {
      "code": 6044,
      "name": "votingPeriodExpired",
      "msg": "Voting period has expired"
    },
    {
      "code": 6045,
      "name": "invalidDeliveryReport",
      "msg": "Invalid delivery report data"
    },
    {
      "code": 6046,
      "name": "invalidOracleSignature",
      "msg": "Invalid oracle signature"
    }
  ],
  "types": [
    {
      "name": "allocationTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "remainingQuantity",
            "type": "u64"
          },
          {
            "name": "totalAllocated",
            "type": "u64"
          },
          {
            "name": "lastProcessedReservePrice",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "appealDecision",
      "docs": [
        "Appeal decision options"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "upheld"
          },
          {
            "name": "rejected"
          }
        ]
      }
    },
    {
      "name": "auctionCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionCleared",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "clearedQuantity",
            "type": "u64"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "winningBidsCount",
            "type": "u32"
          },
          {
            "name": "participatingSellersCount",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionRolledBack",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionState",
      "docs": [
        "Tracks the state of an auction during and after clearing"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "totalClearedQuantity",
            "type": "u64"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "winningBidsCount",
            "type": "u32"
          },
          {
            "name": "participatingSellersCount",
            "type": "u32"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "clearingTimestamp",
            "type": "i64"
          },
          {
            "name": "highestPrice",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "auctionVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "clearedQuantity",
            "type": "u64"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "winningBidsCount",
            "type": "u32"
          },
          {
            "name": "participatingSellersCount",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "totalBuyerPayments",
            "type": "u64"
          },
          {
            "name": "totalSellerProceeds",
            "type": "u64"
          },
          {
            "name": "protocolFees",
            "type": "u64"
          },
          {
            "name": "totalEnergyDistributed",
            "type": "u64"
          },
          {
            "name": "totalEnergyCommitted",
            "type": "u64"
          },
          {
            "name": "totalRefunds",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "autoSlashingTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "shortfallQuantity",
            "type": "u64"
          },
          {
            "name": "penaltyAmount",
            "type": "u64"
          },
          {
            "name": "slashingAmount",
            "type": "u64"
          },
          {
            "name": "appealDeadline",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "batchResult",
      "docs": [
        "Batch processing result for bids"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "processedBids",
            "type": "u32"
          },
          {
            "name": "totalQuantity",
            "type": "u64"
          },
          {
            "name": "highestPrice",
            "type": "u64"
          },
          {
            "name": "lowestPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bid",
      "docs": [
        "A single bid entry"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "quantity",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bidBatchProcessed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "startPage",
            "type": "u32"
          },
          {
            "name": "endPage",
            "type": "u32"
          },
          {
            "name": "processedBids",
            "type": "u32"
          },
          {
            "name": "totalQuantity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bidOutcomeCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "filledQuantity",
            "type": "u64"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bidPage",
      "docs": [
        "Page of bids (linked list)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "bids",
            "type": {
              "vec": {
                "defined": {
                  "name": "bid"
                }
              }
            }
          },
          {
            "name": "nextPage",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "bidRegistry",
      "docs": [
        "Registry to track all bid pages for efficient lookup"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "bidPages",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "totalPages",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "buyerAllocation",
      "docs": [
        "Buyer allocation tracking multi-seller energy distribution"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "totalQuantityWon",
            "type": "u64"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "totalCost",
            "type": "u64"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          },
          {
            "name": "totalEscrowed",
            "type": "u64"
          },
          {
            "name": "energySources",
            "type": {
              "vec": {
                "defined": {
                  "name": "energySource"
                }
              }
            }
          },
          {
            "name": "redeemed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "buyersRefunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "refundedBuyers",
            "type": "u32"
          },
          {
            "name": "totalRefunded",
            "type": "u64"
          },
          {
            "name": "startPage",
            "type": "u32"
          },
          {
            "name": "endPage",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "cancellationState",
      "docs": [
        "Tracks cancellation refund progress"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "totalBuyersRefunded",
            "type": "u32"
          },
          {
            "name": "totalSellersRefunded",
            "type": "u32"
          },
          {
            "name": "totalQuoteRefunded",
            "type": "u64"
          },
          {
            "name": "totalEnergyRefunded",
            "type": "u64"
          },
          {
            "name": "cancellationTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "circuitBreakerTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "triggerReason",
            "type": {
              "defined": {
                "name": "systemStatus"
              }
            }
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "anomalyCount",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "deliveryReport",
      "docs": [
        "Delivery report from oracle"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "deliveredQuantity",
            "type": "u64"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "oracleSignature",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "deliveryVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "deliveredQuantity",
            "type": "u64"
          },
          {
            "name": "oracle",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "emergencyPaused",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "reason",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "emergencyResumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "pauseDuration",
            "type": "i64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "emergencyState",
      "docs": [
        "Emergency pause state"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "pauseTimestamp",
            "type": "i64"
          },
          {
            "name": "pauseReason",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "emergencyWithdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "withdrawalType",
            "type": {
              "defined": {
                "name": "emergencyWithdrawalType"
              }
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "sourceAccount",
            "type": "pubkey"
          },
          {
            "name": "destinationAccount",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "emergencyWithdrawalType",
      "docs": [
        "Emergency withdrawal types"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "cancelledAuction"
          },
          {
            "name": "stuckFunds"
          },
          {
            "name": "protocolUpgrade"
          }
        ]
      }
    },
    {
      "name": "energyRedeemed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "totalQuantity",
            "type": "u64"
          },
          {
            "name": "totalCost",
            "type": "u64"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "energySource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "quantity",
            "type": "u64"
          },
          {
            "name": "escrowAccount",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "fillReceipt",
      "docs": [
        "Receipt created for each winning buyer after settlement"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "quantity",
            "type": "u64"
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "redeemed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "globalState",
      "docs": [
        "Global protocol config"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "maxBatchSize",
            "type": "u16"
          },
          {
            "name": "maxSellersPerTimeslot",
            "type": "u16"
          },
          {
            "name": "maxBidsPerPage",
            "type": "u16"
          },
          {
            "name": "slashingPenaltyBps",
            "type": "u16"
          },
          {
            "name": "appealWindowSeconds",
            "type": "u32"
          },
          {
            "name": "deliveryWindowDuration",
            "type": "u32"
          },
          {
            "name": "minProposalStake",
            "type": "u64"
          },
          {
            "name": "minVotingStake",
            "type": "u64"
          },
          {
            "name": "governanceCouncil",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "councilVoteMultiplier",
            "type": "u16"
          },
          {
            "name": "minParticipationThreshold",
            "type": "u64"
          },
          {
            "name": "authorizedOracles",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "feeVault",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "governanceProposal",
      "docs": [
        "Governance proposal for parameter changes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "proposalType",
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "newValue",
            "type": "u64"
          },
          {
            "name": "description",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "votingDeadline",
            "type": "i64"
          },
          {
            "name": "votesFor",
            "type": "u64"
          },
          {
            "name": "votesAgainst",
            "type": "u64"
          },
          {
            "name": "totalVotingPower",
            "type": "u64"
          },
          {
            "name": "currentSignatures",
            "type": "u8"
          },
          {
            "name": "requiredSignatures",
            "type": "u8"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "executionTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nonDeliveryReported",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "deliveredQuantity",
            "type": "u64"
          },
          {
            "name": "slashingAmount",
            "type": "u64"
          },
          {
            "name": "appealDeadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "priceLevelAggregate",
      "docs": [
        "Aggregates bids at the same price level for efficient demand curve construction"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "totalQuantity",
            "type": "u64"
          },
          {
            "name": "bidCount",
            "type": "u16"
          },
          {
            "name": "cumulativeQuantity",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "proposalType",
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "newValue",
            "type": "u64"
          },
          {
            "name": "votingDeadline",
            "type": "i64"
          },
          {
            "name": "requiredSignatures",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "pubkey"
          },
          {
            "name": "proposalType",
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "newValue",
            "type": "u64"
          },
          {
            "name": "executionTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposalPassed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "pubkey"
          },
          {
            "name": "proposalType",
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "finalVoteCount",
            "type": "u64"
          },
          {
            "name": "votesFor",
            "type": "u64"
          },
          {
            "name": "votesAgainst",
            "type": "u64"
          },
          {
            "name": "signatures",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposalType",
      "docs": [
        "Types of governance proposals"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "feeBps"
          },
          {
            "name": "version"
          },
          {
            "name": "maxBatchSize"
          },
          {
            "name": "maxSellersPerTimeslot"
          },
          {
            "name": "maxBidsPerPage"
          },
          {
            "name": "slashingPenaltyBps"
          },
          {
            "name": "appealWindowSeconds"
          },
          {
            "name": "deliveryWindowDuration"
          },
          {
            "name": "minProposalStake"
          },
          {
            "name": "minVotingStake"
          },
          {
            "name": "emergencyParameterChange"
          },
          {
            "name": "protocolUpgrade"
          }
        ]
      }
    },
    {
      "name": "refundBatchResult",
      "docs": [
        "Refund batch processing result"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "refundedCount",
            "type": "u32"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sellerAllocation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "allocationPrice",
            "type": "u64"
          },
          {
            "name": "proceedsWithdrawn",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sellerAllocationNeeded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "allocationPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sellerRegistry",
      "docs": [
        "Registry to track all sellers for a timeslot"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "sellers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "sellerCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sellersRefunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "refundedSellers",
            "type": "u32"
          },
          {
            "name": "totalRefunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "slashingAppealRejected",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "penaltyConfirmed",
            "type": "u64"
          },
          {
            "name": "finalPenalty",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "slashingAppealUpheld",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "slashingAppealed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "appealEvidence",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "slashingExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "slashingAmount",
            "type": "u64"
          },
          {
            "name": "shortfallQuantity",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "slashingState",
      "docs": [
        "Slashing state for delivery verification"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "allocatedQuantity",
            "type": "u64"
          },
          {
            "name": "deliveredQuantity",
            "type": "u64"
          },
          {
            "name": "slashingAmount",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "reportTimestamp",
            "type": "i64"
          },
          {
            "name": "appealDeadline",
            "type": "i64"
          },
          {
            "name": "executionTimestamp",
            "type": "i64"
          },
          {
            "name": "resolutionTimestamp",
            "type": "i64"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "resolutionEvidence",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "supply",
      "docs": [
        "Minimal Supply struct for MVP (one-time immutable per timeslot)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "reservePrice",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "energyMint",
            "type": "pubkey"
          },
          {
            "name": "escrowVault",
            "type": "pubkey"
          },
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "supplyAllocationResult",
      "docs": [
        "Supply allocation result"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "processedSellers",
            "type": "u32"
          },
          {
            "name": "totalAllocated",
            "type": "u64"
          },
          {
            "name": "remainingDemand",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "supplyBatchProcessed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timeslot",
            "type": "pubkey"
          },
          {
            "name": "processedSellers",
            "type": "u32"
          },
          {
            "name": "totalAllocated",
            "type": "u64"
          },
          {
            "name": "remainingDemand",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "supplyCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "supplier",
            "type": "pubkey"
          },
          {
            "name": "timeslot",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "systemHealthReport",
      "docs": [
        "System health report"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "overallStatus",
            "type": {
              "defined": {
                "name": "systemStatus"
              }
            }
          },
          {
            "name": "activeAuctions",
            "type": "u32"
          },
          {
            "name": "pendingSettlements",
            "type": "u32"
          },
          {
            "name": "totalLockedValue",
            "type": "u64"
          },
          {
            "name": "failedDeliveries",
            "type": "u32"
          },
          {
            "name": "emergencyPauseActive",
            "type": "bool"
          },
          {
            "name": "emergencyPaused",
            "type": "bool"
          },
          {
            "name": "lastCheckTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "systemStatus",
      "docs": [
        "System health status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "healthy"
          },
          {
            "name": "warning"
          },
          {
            "name": "critical"
          }
        ]
      }
    },
    {
      "name": "timeslot",
      "docs": [
        "Auction round container"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochTs",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "lotSize",
            "type": "u64"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "priceTick",
            "type": "u64"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "totalBids",
            "type": "u64"
          },
          {
            "name": "headPage",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "tailPage",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "clearingPrice",
            "type": "u64"
          },
          {
            "name": "totalSoldQuantity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vote",
      "docs": [
        "Vote options"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "for"
          },
          {
            "name": "against"
          }
        ]
      }
    },
    {
      "name": "voteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "vote",
            "type": {
              "defined": {
                "name": "vote"
              }
            }
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "isCouncilMember",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "docs": [
        "Individual vote record"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "vote",
            "type": {
              "defined": {
                "name": "vote"
              }
            }
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
