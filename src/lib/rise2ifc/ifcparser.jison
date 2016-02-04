
/* simple jison parser for ISO 10303-21 
   http://www.steptools.com/library/standard/p21e3_dis_paris.html
   
   2016-02 : initial version ulrich.krispel@fraunhofer.at
*/

/* lexical grammar */
%lex

/* token matches */

Space " "
Digit [0-9]
Lower [a-z]
Upper [A-Z_]
UpperOrDigit {Upper}|{Digit}
UpperOrLower {Upper}|{Lower}
UpperOrLowerOrDigit {Upper}|{Lower}|{Digit}
Special [\!\"\*\$\%\&\.\#\+\,\-\(\)\=\/\:\;\<\=\>\@\[\]\{\|\}\^\]\`\~]

Keyword {UserDefinedKeyword}|{StandardKeyword}
KeywordPart {Upper}|{Digit}
UserDefinedKeyword \!{Upper}{KeywordPart}*
StandardKeyword {Upper}{KeywordPart}*
Sign [+-]
Real [+-]?[0-9]+"."[0-9]*{Exponent}?
Integer {Sign}?{Digit}+
Exponent "E"[+-]?[0-9]+

StringCharacter {Digit}|{Space}|{Lower}|{Upper}|{Special}|\\\\|\'\'
/* String \'{StringCharacter}*\' */
String \'[^\']*\'
EntityName "#"[0-9]+
ValueName "@"[0-9]+
InstanceName {EntityName}|{ValueName}


ObjectIdentifier "{"{UpperOrLowerOrDigit}*"}"
ExpressConstant {Upper}{UpperOrDigit}*{ObjectIdentifier}*"."{Upper}{UpperOrDigit}*
AnchorName "TODO"
Resource "TODO"
TagName UpperOrLower{UpperOrLowerOrDigit}*
Enumeration "."{Upper}{UpperOrDigit}*"."
HexDigit [0-9A-F]
Binary  \"[0-3]{HexDigit}\"

%%
/* token types */

\s+                    /* skip whitespace */

"ISO-10303-21;"        return "BEGIN_TOKEN";
"END-ISO-10303-21;"    return "END_TOKEN";
"ENDSEC;"              return "END_SECTION";
"HEADER;"              return "BEGIN_HEADER";
"ANCHOR;"              return "BEGIN_ANCHOR";
"REFERENCE;"           return "BEGIN_REFERENCE";
"DATA"                 return "BEGIN_DATA";

{Keyword}              return "KEYWORD";
{EntityName}           return "ENTITY_NAME";
{Real}                 return "REAL";
{Integer}              return "INTEGER";
{Enumeration}          return "ENUMERATION";
{String}               return "STRING";
{Binary}               return "BINARY";

"("                    return "(";
")"                    return ")";
","                    return ",";
";"                    return ";";
"*"                    return "*";
"="                    return "=";
"$"                    return "$";

/lex

/* operator associations and precedence */

%start exchange_file

%% /* language grammar */

exchange_file : 
    BEGIN_TOKEN
    header_section 
    anchor_section 
    reference_section 
    data_section
    END_TOKEN 
    {
      var result = {};
      result.HEADER = $2;
      result.ANCHOR = $3;
      result.REFERENCE = $4;
      result.DATA = $5;
      $$=result; 
    }
    ;


/* --------------------------------------------------- PARAMETERS */

parameter_list: /* parameter_list can be empty */
          | parameter_list2;
parameter_list2 : 
    parameter 
    { $$ = []; $$.push($1); }
  | parameter_list2 "," parameter 
    { $$.push($3); }
  ;

parameter : typed_parameter 
          | untyped_parameter 
          | omitted_parameter;

typed_parameter: KEYWORD "(" parameter ")";

untyped_parameter: "$" 
                 | INTEGER
                 | REAL
                 | STRING
                 | ENTITY_NAME
                 | ENUMERATION
                 | BINARY
                 | "(" parameter_list ")" { $$ = $2; };
                 
omitted_parameter: "*";

/* --------------------------------------------------- HEADER SECTION */

header_section : /* header section can be optional */
  header | ;

header : BEGIN_HEADER 
         header_entity header_entity header_entity
         header_entity_list
         END_SECTION;

header_entity_list : /* can be empty */
        | header_entity_list1;
        
header_entity_list1:
        header_entity |
        header_entity_list1 header_entity;

header_entity : 
        KEYWORD "(" parameter_list ")" ";";

/* --------------------------------------------------- DATA SECTION */

data_section : 
    BEGIN_DATA  
    parameter_list ";"
    entity_instance_list
    END_SECTION { return $4; } ;

entity_instance_list: /* can be empty */
  | entity_instance_list1;

entity_instance_list1 : 
    entity_instance                       { var result={};
                                            result[$1[0]] = $1[1];
                                            $$=result;
                                          }
  | entity_instance_list1 entity_instance { var obj = $1;
                                            obj[$2[0]] = $2[1];
                                            $$=obj;
                                          };

entity_instance: 
    simple_entity_instance 
  | complex_entity_instance;

simple_entity_instance : 
    ENTITY_NAME "=" simple_record ";" 
    { $$ = [ $1, $3 ]; }
    ;

complex_entity_instance :
    ENTITY_NAME "=" subsuper_record ";";

simple_record :
    KEYWORD "(" parameter_list ")" 
    { $$={};
      $$[$1] = $3;
    };

subsuper_record :
    "(" simple_record_list ")";
    
simple_record_list :
    simple_record
  | simple_record_list simple_record;
  
/* --------------------------------------------------- NOT IMPLEMENTED YET */

anchor_section : ;
reference_section : ;
