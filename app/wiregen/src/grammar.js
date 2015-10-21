"use strict";
// simple attributed symbol grammar
//
// ulrich.krispel@vc.fraunhofer.at

var VEC = require('./vec.js');

// -----------------------------------------------------
// Terminals are lowercase
function isTerminal(S)
{
    return S.label.toLowerCase() == S.label;
}

function BB(att) {
    return new VEC.AABB(new VEC.Vec2(att.left, att.top), 
                    new VEC.Vec2(att.left + att.width, att.top + att.height));
}

function  DIFF (value_a, value_b) {
    return Math.abs(value_a - value_b);
}

function filterNT(NT, label)
{
    var filtered = [];
    NT.forEach(function (nt) { if (nt.label == label) filtered.push(nt); });
    return filtered;
}

function evaluateStatement(match, statement)
{
    // set available functions
    var names  = ['BB','DIFF'];
    var values = [ BB , DIFF ];
    // set current state
    for (var v in match.state) {
        names.push(v);
        values.push(match.state[v]);
    }
    names.push("return (" + statement + ")");
    var result = Function.apply(null, names).apply(null, values);
    return result;
}

// prepare rule state: initialize variables and testcondition
function prepareRuleState(match)
{
    match.evaluate = true;
    if (match.rule.hasOwnProperty('vars')) {
        for (var v in match.rule.vars) {
            match.state[v] = evaluateStatement(match, match.rule.vars[v]);
        }
    }
    if (match.rule.hasOwnProperty('condition')) {
        match.evaluate = evaluateStatement(match, match.rule.condition) == true;
    }
}

function performRuleProductions(match)
{
    var prod = [];
    var att = match.NT[0].attributes;
    
    var dbgout = "";
    match.NT.forEach(function (nt) { dbgout += nt.label + ":"; });
    dbgout += " => ";

    for (var i =0; i< match.rule.rhs.length; ++i) {
        var rhs = match.rule.rhs[i];
        var N = {
            "label"      : rhs.label,
            "attributes" : JSON.parse(JSON.stringify(att))
        };
        
        // evaluate attributes
        if (rhs.attributes) {
            for (var attname in rhs.attributes) {
                N.attributes[attname] = evaluateStatement(match, rhs.attributes[attname]);
            }
        }
        
        dbgout += rhs.label + " ";
        //dbgout += rhs.label + "[";
        //for (var a in N.attributes) {
        //    dbgout += a + ":" + N.attributes[a] + ",";
        //}
        //dbgout += "] ";
        
        prod.push(N);
    }
    console.log(dbgout);
    return prod;
}

// find a match in a set of non-terminals
// highly non-optimized :)
function findMatch(NT, G)
{
    var match = {
        NT: [],
        rule: {},
        state: {},
        label: "",
        evaluate: true
    }
    
    for (var label in G) {
        // see if there is a context sensitive match
        var i = label.indexOf(":");
        if (i >= 0) {
            var lblA = label.substring(0, i);
            var lblB = label.substring(i + 1, label.length);
            
            if (lblA == lblB) {
                // find elements of the same label
                var matches = filterNT(NT, lblA);
                for (var iA = 0; iA < matches.length - 1; ++iA) {
                    for (var iB = iA + 1; iB < matches.length; ++iB) {
                        for (var iR = 0; iR < G[label].length; ++iR) {
                            match.rule = G[label][iR];
                            match.label = label;
                            match.state.A = matches[iA].attributes;
                            match.state.B = matches[iB].attributes;
                            prepareRuleState(match);
                            if (match.evaluate) {
                                match.NT.push(matches[iA]);
                                match.NT.push(matches[iB]);
                                return match;
                            }
                        }
                    }
                }
            } else {
                // match elements of different labels
                var matchA = filterNT(NT, lblA);
                var matchB = filterNT(NT, lblB);
                for (var iA = 0; iA < matchA.length - 1; ++iA) {
                    for (var iB = 0; iB < matchB.length; ++iB) {
                        for (var iR = 0; iR < G[label].length; ++iR) {
                            match.rule = G[label][iR];
                            match.label = label;
                            match.state.A = matchA[iA].attributes;
                            match.state.B = matchB[iB].attributes;
                            prepareRuleState(match);
                            if (match.evaluate) {
                                match.NT.push(matchA[iA]);
                                match.NT.push(matchB[iB]);
                                return match;
                            }
                        }
                    }
                }                
            }
        }
    }
    
    // context free matches
    for (var nt in NT) {
        var label = NT[nt].label;
        if (label in G) {
            for (var iR = 0; iR < G[label].length; ++iR) {
                match.rule = G[label][iR];
                match.label = label;
                match.state = NT[nt].attributes;
                prepareRuleState(match);
                if (match.evaluate) {
                    match.NT.push(NT[nt]);
                    return match;
                }
            }
        } else {
          console.log("[WireGen] Grammar error: non-terminal " + NT[nt].label + " not found in grammar.");
        }
    }
    // no match found
    match.evaluate = false;
    return match;
}

function evaluateGrammarStep(NT, T, G)
{
    var match = findMatch(NT, G);
    if (match.evaluate) {
        var result = performRuleProductions(match);
        
        // remove non-terminals
        for (var i=0; i<match.NT.length; ++i) {
            var nti = NT.indexOf(match.NT[i]);
            if (nti != -1) { NT.splice(nti, 1); }
        }
        
        // add symbols
        for (var i in result) {
            var s = result[i];
            if (isTerminal(s)) {
                T.push(s);
            } else {
                NT.push(s);
            }
        }
        return true;
    }
    return false;
}


module.exports = {
    evaluateGrammarStep : evaluateGrammarStep
};
