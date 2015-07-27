"use strict";
// simple attributed symbol grammar
//
// ulrich.krispel@vc.fraunhofer.at

// -----------------------------------------------------
// Terminals are lowercase
function isTerminal(S)
{
    return S.label.toLowerCase() == S.label;
}

function evaluateGrammarStep(NT, T, G)
{
    var result = [];
    var GrammarEvaluated = true;
    NT.forEach(function (lhs)
        {
            // Convention: parent attributes are accessible via "att."
            var att = lhs.attributes;

            // a symbol is considered terminal if it is not defined in the grammar
            if (lhs.label in G)
            {
                GrammarEvaluated = false;
                var dbgtext=lhs.label + " => ";
                var rule = G[lhs.label];
                // rule is an array of symbols to create
                rule.forEach( function(rhs)
                {
                    // create new symbol, inherit attributes
                    var N = {
                        "label"      : rhs.label,
                        "attributes" : JSON.parse(JSON.stringify(att))
                    };

                    // evaluate attributes
                    if ('attributes' in rhs) {
                        Object.keys(rhs.attributes).forEach(function (attname, attid) {
                            N.attributes[attname] = eval(rhs.attributes[attname]);
                        });
                    }

                    dbgtext += rhs.label + " ";
                    if (isTerminal(N))  { T.push(N); }
                    else                { result.push(N); }

                } );
                console.log(dbgtext);
            } else {
                // rule not found
                console.log("[ERROR] Rule %s not found", lhs.label);
            }
        }
    );
    return result;
}


module.exports = {
    evaluateGrammarStep : evaluateGrammarStep
};
