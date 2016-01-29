
/* simple step parser */

/* lexical grammar */
%lex

DecimalDigit [0-9]
DecimalDigits [0-9]+
NonZeroDigit [1-9]
OctalDigit [0-7]
HexDigit [0-9a-fA-F]
IdentifierStart [$_a-zA-Z]|("\\"[u]{HexDigit}{4})
IdentifierPart {UnicodeIdentifierPart}|[0-9]
Identifier {IdentifierStart}{IdentifierPart}*
ExponentIndicator [eE]
SignedInteger [+-]?[0-9]+
DecimalIntegerLiteral [0]|({NonZeroDigit}{DecimalDigits}*)
ExponentPart {ExponentIndicator}{SignedInteger}
OctalIntegerLiteral [0]{OctalDigit}+
HexIntegerLiteral [0][xX]{HexDigit}+
DecimalLiteral ({DecimalIntegerLiteral}\.{DecimalDigits}*{ExponentPart}?)|(\.{DecimalDigits}{ExponentPart}?)|({DecimalIntegerLiteral}{ExponentPart}?)
LineContinuation \\(\r\n|\r|\n)
OctalEscapeSequence (?:[1-7][0-7]{0,2}|[0-7]{2,3})
HexEscapeSequence [x]{HexDigit}{2}
UnicodeEscapeSequence [u]{HexDigit}{4}
SingleEscapeCharacter [\'\"\\bfnrtv]
NonEscapeCharacter [^\'\"\\bfnrtv0-9xu]
CharacterEscapeSequence {SingleEscapeCharacter}|{NonEscapeCharacter}
EscapeSequence {CharacterEscapeSequence}|{OctalEscapeSequence}|{HexEscapeSequence}|{UnicodeEscapeSequence}
DoubleStringCharacter ([^\"\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
SingleStringCharacter ([^\'\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
StringLiteral (\"{DoubleStringCharacter}*\")|(\'{SingleStringCharacter}*\')


%%
/* token types */

\s+                    /* skip whitespace */

/* comment */
"//".*($|\r\n|\r|\n)  %{
                          if (yytext.match(/\r|\n/)) {
                              parser.newLine = true;
                          }
                      %}

/* header entities */
"FILE_DESCRIPTION"     return "FILE_DESCRIPTION";
"FILE_NAME"            return "FILE_NAME";
"FILE_SCHEMA"          return "FILE_SCHEMA";

"FILE_POPULATION"      return "FILE_POPULATION";
"SECTION_LANGUAGE"     return "SECTION_LANGUAGE";
"SECTION_CONTEXT"      return "SECTION_CONTEXT";

{StringLiteral}        return "STRING_LITERAL";
"ISO-10303-21"         return 'STEPID';
"HEADER"               return 'HEADERMARK';
"DATA"                 return 'DATAMARK';
"ENDSEC"               return 'ENDSEC';
";"                    return 'ENDSTATEMENT';
"\n"                   return 'ENDLINE';
{DecimalLiteral}       return "NUMERIC_LITERAL";
{HexIntegerLiteral}    return "NUMERIC_LITERAL";
{OctalIntegerLiteral}  return "NUMERIC_LITERAL";
<<EOF>>                return 'EOF'
"#"                    return 'HASH';
"="                    return 'EQUAL';
"("                    return "(";
")"                    return ")";
","                    return ",";
"$"                    return "DOLLAR";
"."                    return "DOT";
"*"                    return "STAR";
{Identifier}           return "IDENTIFIER";

/lex

/* operator associations and precedence */

%start ifcstart

%% /* language grammar */

ifcstart :
  STEPID ENDSTATEMENT ifcheader ifcdata EOF;

ifcheader :
  HEADERMARK ENDSTATEMENT headerlines ENDSEC ENDSTATEMENT;

ifcdata : 
  DATAMARK ENDSTATEMENT datalines ENDSEC ENDSTATEMENT;

parameter :
  STRING_LITERAL 
  | "(" STRING_LITERAL ")" 
  | "(" ")" 
  | NUMERIC_LITERAL 
  | DOLLAR 
  | STAR
  | HASH NUMERIC_LITERAL
  | DOT IDENTIFIER DOT
  | IDENTIFIER parameters
  | parameters
  ;

parameterlist :
  parameter | parameterlist "," parameter;

parameters : 
  "(" parameterlist ")" ;

headerlines :
/* header structure is fixed */
  FILE_DESCRIPTION parameters ENDSTATEMENT
  FILE_NAME parameters ENDSTATEMENT
  FILE_SCHEMA parameters ENDSTATEMENT
  |
  FILE_DESCRIPTION parameters ENDSTATEMENT
  FILE_NAME parameters ENDSTATEMENT
  FILE_SCHEMA parameters ENDSTATEMENT
  FILE_POPULATION parameters ENDSTATEMENT
  SECTION_LANGUAGE parameters ENDSTATEMENT
  SECTION_CONTEXT parameters ENDSTATEMENT;

dataline :
  HASH NUMERIC_LITERAL EQUAL IDENTIFIER parameters ENDSTATEMENT;
  
datalines :
  dataline |
  datalines dataline;

