require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const db = require("../db");

const questions = [
  // ==========================================
  // MODULE 11 (Chapter 1): Variables & Data Types
  // ==========================================
  // --- INTERMEDIATE (20) ---
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the size of a double data type in Java?",
    a: "4 bytes",
    b: "8 bytes",
    c: "16 bytes",
    d: "2 bytes",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which of the following is NOT a primitive data type in Java?",
    a: "int",
    b: "boolean",
    c: "String",
    d: "char",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the default value of a boolean instance variable in Java?",
    a: "true",
    b: "false",
    c: "null",
    d: "1",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the result of the expression: 10 % 3?",
    a: "3",
    b: "1",
    c: "0.33",
    d: "0",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "How do you declare a constant variable X in Java with a value of 10?",
    a: "const int X = 10;",
    b: "final int X = 10;",
    c: "static int X = 10;",
    d: "constant X = 10;",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which of the following is a valid float declaration in Java?",
    a: "float f = 1.2;",
    b: "float f = 1.2f;",
    c: "float f = (double)1.2;",
    d: "float f = 1.2d;",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the default value of a local variable in Java?",
    a: "0",
    b: "null",
    c: "It has no default value and must be initialized before use",
    d: "false",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which Java class is best suited for precise currency calculations?",
    a: "double",
    b: "Float",
    c: "BigDecimal",
    d: "Double",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the range of the byte data type in Java?",
    a: "-32,768 to 32,767",
    b: "-128 to 127",
    c: "0 to 255",
    d: "-2,147,483,648 to 2,147,483,647",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the result of: int x = (int) 5.9;?",
    a: "6",
    b: "5",
    c: "5.9",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which of these is a reference (non-primitive) type in Java?",
    a: "char",
    b: "double",
    c: "Integer",
    d: "long",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the default value of an object reference variable in Java?",
    a: "void",
    b: "0",
    c: "null",
    d: "undefined",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the size of a char data type in Java?",
    a: "1 byte",
    b: "2 bytes",
    c: "4 bytes",
    d: "8 bytes",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which of the following is a valid identifier (variable name) in Java?",
    a: "1stVariable",
    b: "_myVar",
    c: "class",
    d: "my-var",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the output of: System.out.println(5 + 2 + \"3\");?",
    a: "523",
    b: "73",
    c: "10",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the output of: System.out.println(\"3\" + 5 + 2);?",
    a: "37",
    b: "352",
    c: "10",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which keyword is used to prevent a variable from being re-assigned?",
    a: "static",
    b: "abstract",
    c: "final",
    d: "volatile",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What is the result of parsing '123' to an integer using Integer.parseInt('123')?",
    a: "123.0",
    b: "123",
    c: "'123'",
    d: "Throws NumberFormatException",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "Which of these is NOT a valid integer declaration in Java?",
    a: "int x = 1_000_000;",
    b: "int x = 0x1A;",
    c: "int x = 0b1010;",
    d: "int x = 1,000;",
    correct: "D"
  },
  {
    module_id: 11,
    difficulty: "intermediate",
    prompt: "What happens when a binary operator is applied to a double and a float?",
    a: "The double is promoted to float",
    b: "The float is promoted to double",
    c: "The operation causes a compile-time error",
    d: "Both are converted to int",
    correct: "B"
  },
  // --- ADVANCED (10) ---
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the output of the following code: byte a = 127; a++; System.out.println(a);?",
    a: "128",
    b: "-128",
    c: "0",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "In Java, what encoding scheme is used to represent characters in the char data type?",
    a: "ASCII",
    b: "UTF-8",
    c: "UTF-16",
    d: "ISO-8859-1",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the difference between == and equals() when comparing two String objects?",
    a: "== compares content, equals() compares memory addresses",
    b: "== compares memory addresses, equals() compares content",
    c: "There is no difference",
    d: "== is only for primitives, equals() is only for classes",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the output of: Integer a = 100; Integer b = 100; System.out.println(a == b);?",
    a: "true",
    b: "false",
    c: "NullPointerException",
    d: "Compile-time error",
    correct: "A"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the output of: Integer a = 200; Integer b = 200; System.out.println(a == b);?",
    a: "true",
    b: "false",
    c: "NullPointerException",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the binary representation of the integer -1 in a 32-bit Java int?",
    a: "00000000000000000000000000000001",
    b: "10000000000000000000000000000001",
    c: "11111111111111111111111111111111",
    d: "11111111111111111111111111111110",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What happens when you assign a double value to a float variable without casting?",
    a: "The value is truncated automatically",
    b: "The value is rounded automatically",
    c: "It results in a compile-time error",
    d: "It compiles but throws ClassCastException at runtime",
    correct: "C"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the output of: System.out.println(Double.MIN_VALUE > 0);?",
    a: "true",
    b: "false",
    c: "Compile-time error",
    d: "Prints NaN",
    correct: "A"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "What is the process of automatically converting a primitive type to its corresponding wrapper class?",
    a: "Autoboxing",
    b: "Unboxing",
    c: "Casting",
    d: "Widening",
    correct: "A"
  },
  {
    module_id: 11,
    difficulty: "advanced",
    prompt: "Which of the following expressions evaluates to NaN (Not a Number)?",
    a: "1.0 / 0.0",
    b: "-1.0 / 0.0",
    c: "0.0 / 0.0",
    d: "Math.sqrt(4.0)",
    correct: "C"
  },

  // ==========================================
  // MODULE 12 (Chapter 2): If / Else
  // ==========================================
  // --- INTERMEDIATE (20) ---
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the result of the expression: true && false || true?",
    a: "false",
    b: "true",
    c: "Compile-time error",
    d: "runtime exception",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which operator has the highest precedence in Java?",
    a: "&&",
    b: "||",
    c: "!",
    d: "==",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which of the following represents the ternary operator in Java?",
    a: "if-else",
    b: "? :",
    c: "&&",
    d: "instanceof",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Can a switch statement accept a double expression in Java?",
    a: "Yes, always",
    b: "No, switch does not support floating-point types",
    c: "Yes, if cast to float",
    d: "Yes, in Java 8 and above",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: int x = 5; if (x == 5) { int y = 10; } System.out.println(y);?",
    a: "10",
    b: "0",
    c: "Compile-time error due to variable scope",
    d: "null",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What happens in a switch statement if a case block does not end with a break?",
    a: "The program throws a runtime exception",
    b: "The switch statement terminates immediately",
    c: "Execution falls through to the next case",
    d: "The compiler throws an error",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which of the following types CANNOT be used in a switch statement expression?",
    a: "char",
    b: "String",
    c: "boolean",
    d: "int",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: boolean x = true; if (x = false) System.out.print('A'); else System.out.print('B');?",
    a: "A",
    b: "B",
    c: "AB",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is short-circuit evaluation in the context of the && operator?",
    a: "If the first operand is true, the second is not evaluated",
    b: "If the first operand is false, the second is not evaluated",
    c: "Both operands are always evaluated",
    d: "The operator executes faster than bitwise &",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is short-circuit evaluation in the context of the || operator?",
    a: "If the first operand is true, the second is not evaluated",
    b: "If the first operand is false, the second is not evaluated",
    c: "Both operands are always evaluated",
    d: "It throws an exception if the second operand is null",
    correct: "A"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which block in a try-catch-finally statement is guaranteed to run even if an exception occurs?",
    a: "try",
    b: "catch",
    c: "finally",
    d: "None of them",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which expression safely checks if a String s is null or empty without throwing a NullPointerException?",
    a: "s.isEmpty() || s == null",
    b: "s == null || s.isEmpty()",
    c: "s != null && s.length() == 0",
    d: "Both B and C",
    correct: "D"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: int x = 10; if (x > 5) if (x > 8) System.out.print('A'); else System.out.print('B');?",
    a: "A",
    b: "B",
    c: "AB",
    d: "Nothing is printed",
    correct: "A"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: int x = 10; if (x < 5) if (x > 8) System.out.print('A'); else System.out.print('B');?",
    a: "A",
    b: "B",
    c: "AB",
    d: "Nothing is printed",
    correct: "D"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Can you write an else statement without a preceding if statement?",
    a: "Yes, in switch blocks",
    b: "No, else must always be paired with a preceding if",
    c: "Yes, using ternary syntax",
    d: "Yes, inside loops",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the keyword used in switch to handle cases that do not match any specified value?",
    a: "else",
    b: "default",
    c: "catch",
    d: "break",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: int x = 1; switch(x) { case 1: System.out.print('1'); case 2: System.out.print('2'); }?",
    a: "1",
    b: "12",
    c: "2",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "Which operator is used for the logical NOT operation in Java?",
    a: "~",
    b: "!",
    c: "NOT",
    d: "!=",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: if (Double.NaN == Double.NaN) System.out.print('Yes'); else System.out.print('No');?",
    a: "Yes",
    b: "No",
    c: "Compile-time error",
    d: "NullPointerException",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "intermediate",
    prompt: "What is the output of: int score = 85; char grade = score > 90 ? 'A' : (score > 80 ? 'B' : 'C'); System.out.print(grade);?",
    a: "A",
    b: "B",
    c: "C",
    d: "Compile-time error",
    correct: "B"
  },
  // --- ADVANCED (10) ---
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the difference between the & and && operators when used with booleans?",
    a: "& is short-circuit, && is not",
    b: "&& is short-circuit, & is not",
    c: "There is no difference",
    d: "&& is only for numbers, & is for booleans",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the difference between the | and || operators when used with booleans?",
    a: "| is short-circuit, || is not",
    b: "|| is short-circuit, | is not",
    c: "There is no difference",
    d: "|| is bitwise, | is logical",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the output of: int x = 0; if (x++ > 0 && ++x > 0) {} System.out.println(x);?",
    a: "0",
    b: "1",
    c: "2",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the output of: int x = 0; if (x++ > 0 & ++x > 0) {} System.out.println(x);?",
    a: "0",
    b: "1",
    c: "2",
    d: "Compile-time error",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the output of: int x = 5; System.out.println(x > 5 ? 9.0 : 5);?",
    a: "5",
    b: "5.0",
    c: "9.0",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "In Java 16+, what feature allows matching a type and casting it in a single step (e.g., if (obj instanceof String s))?",
    a: "Type Casting",
    b: "Pattern Matching for instanceof",
    c: "Dynamic Dispatch",
    d: "Autoboxing",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "Which bytecode instruction is generated by the compiler for a switch statement with contiguous case values?",
    a: "lookupswitch",
    b: "tableswitch",
    c: "goto",
    d: "ifeq",
    correct: "B"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "Which bytecode instruction is generated by the compiler for a switch statement with non-contiguous case values?",
    a: "lookupswitch",
    b: "tableswitch",
    c: "goto",
    d: "ifne",
    correct: "A"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the output of: Boolean b = null; if (b) System.out.print('1'); else System.out.print('2');?",
    a: "1",
    b: "2",
    c: "NullPointerException during unboxing",
    d: "Compile-time error",
    correct: "C"
  },
  {
    module_id: 12,
    difficulty: "advanced",
    prompt: "What is the output of: int a=10, b=20; System.out.println(a > b ? a++ : b++);?",
    a: "10",
    b: "20",
    c: "21",
    d: "11",
    correct: "B"
  },

  // ==========================================
  // MODULE 13 (Chapter 3): Loops
  // ==========================================
  // --- INTERMEDIATE (20) ---
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output of the loop statement: for(;;)?",
    a: "Runs exactly once",
    b: "Compile-time error",
    c: "Infinite loop",
    d: "Does not compile in Java",
    correct: "C"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "Which loop is best suited when the number of iterations is NOT known beforehand?",
    a: "for loop",
    b: "while loop",
    c: "for-each loop",
    d: "None of the above",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the final value of i: int i = 0; do { i++; } while (i < 0);?",
    a: "0",
    b: "1",
    c: "-1",
    d: "Infinite loop",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "How many times does a do-while loop execute its body at minimum?",
    a: "0",
    b: "1",
    c: "2",
    d: "Depends on the condition",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output of: for(int i=0; i<3; i++) { if(i==1) break; System.out.print(i); }?",
    a: "0",
    b: "01",
    c: "02",
    d: "012",
    correct: "A"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output of: for(int i=0; i<3; i++) { if(i==1) continue; System.out.print(i); }?",
    a: "0",
    b: "01",
    c: "02",
    d: "012",
    correct: "C"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "Can you declare multiple variables of different data types in a single for-loop initialization?",
    a: "Yes, e.g., for(int i=0, double d=0.0; ...)",
    b: "No, all declared variables must be of the same type",
    c: "Yes, if separated by semicolons",
    d: "Yes, using var",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the common term for the enhanced for loop in Java?",
    a: "while-each loop",
    b: "for-each loop",
    c: "do-each loop",
    d: "iterator loop",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What exception is thrown if you modify a collection's structure directly while iterating over it using a for-each loop?",
    a: "NullPointerException",
    b: "ArrayIndexOutOfBoundsException",
    c: "ConcurrentModificationException",
    d: "IllegalStateException",
    correct: "C"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the final value of x: int x = 5; while(x > 0) { x--; if(x == 2) break; }?",
    a: "0",
    b: "2",
    c: "5",
    d: "3",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "In Java, what is a labeled break statement used for?",
    a: "To jump to any line of code",
    b: "To break out of an outer nested loop",
    c: "To terminate the program immediately",
    d: "To skip an iteration of a loop",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "In Java, what is a labeled continue statement used for?",
    a: "To restart the current loop from 0",
    b: "To skip the current iteration of an outer nested loop",
    c: "To jump to the next method",
    d: "To break out of nested loops",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "How do you write an infinite while loop in Java?",
    a: "while()",
    b: "while(true)",
    c: "while(1)",
    d: "while(infinite)",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "How many times does this loop run: for(int i=0, j=10; i<j; i++, j--)?",
    a: "10 times",
    b: "5 times",
    c: "11 times",
    d: "Infinite times",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output: int i=0; for(;i<3;) { i++; } System.out.print(i);?",
    a: "0",
    b: "3",
    c: "2",
    d: "Compile-time error",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "Which loop structure is most appropriate for traversing a 2-dimensional grid (array)?",
    a: "Single while loop",
    b: "Nested loops",
    c: "Ternary loop",
    d: "Recursion only",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output of: for(int i=0; i<5; i+=2) System.out.print(i);?",
    a: "01234",
    b: "024",
    c: "02",
    d: "24",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "Can a loop's condition check include method calls, such as: while(list.size() > 0)?",
    a: "No, conditions must only compare variables",
    b: "Yes, any expression that evaluates to a boolean is allowed",
    c: "Yes, but only in for loops",
    d: "Yes, but only if the method is static",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What happens if a loop has no exit condition and no break statement?",
    a: "It terminates after 1000 iterations",
    b: "It causes a compile-time error",
    c: "It runs infinitely, consuming CPU resources",
    d: "The JVM throws a LoopOverflowException",
    correct: "C"
  },
  {
    module_id: 13,
    difficulty: "intermediate",
    prompt: "What is the output: int i=5; while(i>0) { i--; } System.out.print(i);?",
    a: "5",
    b: "0",
    c: "1",
    d: "-1",
    correct: "B"
  },
  // --- ADVANCED (10) ---
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "How can you safely remove elements from a Collection while iterating over it?",
    a: "Use a standard for-each loop and call collection.remove()",
    b: "Use an Iterator and call iterator.remove()",
    c: "Use a do-while loop with an index",
    d: "It is impossible in Java",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What optimization technique does the JIT compiler use to reduce loop overhead by duplicating the loop body?",
    a: "Loop Inversion",
    b: "Loop Unrolling",
    c: "Loop Fission",
    d: "Dead Code Elimination",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What is the output of the following code:\nouter: for(int i=0; i<3; i++) {\n  for(int j=0; j<3; j++) {\n    if(i==1) break outer;\n    System.out.print(i);\n  }\n}?",
    a: "000",
    b: "000222",
    c: "012",
    d: "000111222",
    correct: "A"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What is the performance difference between a standard for loop and a for-each loop on a LinkedList?",
    a: "for-each is O(N^2), standard indexed for is O(N)",
    b: "for-each is O(N), standard indexed for is O(N^2)",
    c: "Both are O(N)",
    d: "Both are O(N^2)",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What is the output of the code: int i = 0; for (System.out.print(\"A\"); i < 1; System.out.print(\"C\")) { i++; System.out.print(\"B\"); }?",
    a: "ABC",
    b: "ABB",
    c: "ACB",
    d: "BAC",
    correct: "A"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "Can a do-while loop's condition access a variable declared inside the do block?",
    a: "Yes, always",
    b: "No, because the variable is out of scope in the while condition check",
    c: "Yes, if the variable is marked final",
    d: "Yes, in Java 11 and above",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What loop optimization technique moves expressions that yield the same value on every iteration outside the loop?",
    a: "Loop invariant code motion",
    b: "Loop unrolling",
    c: "Loop fission",
    d: "Loop peeling",
    correct: "A"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "How does the Java compiler translate a for-each loop over an array?",
    a: "It translates it into an Iterator-based while loop",
    b: "It translates it into a standard index-based for loop",
    c: "It keeps it as a native foreach bytecode instruction",
    d: "It translates it into recursion",
    correct: "B"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "How does the Java compiler translate a for-each loop over an Iterable class (like ArrayList)?",
    a: "It translates it into an Iterator-based while loop",
    b: "It translates it into a standard index-based for loop",
    c: "It translates it into a switch statement",
    d: "It keeps it as a native foreach bytecode instruction",
    correct: "A"
  },
  {
    module_id: 13,
    difficulty: "advanced",
    prompt: "What is the output of the code: int x = 0; do { System.out.print(x); } while (x > 0);?",
    a: "0",
    b: "00",
    c: "Infinite 0s",
    d: "Nothing is printed",
    correct: "A"
  },

  // ==========================================
  // MODULE 14 (Chapter 4): OOP Basics
  // ==========================================
  // --- INTERMEDIATE (20) ---
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is the default access modifier in Java when no modifier is specified?",
    a: "public",
    b: "private",
    c: "protected",
    d: "package-private (default)",
    correct: "D"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Which keyword is used to inherit properties and behaviors from a parent class?",
    a: "implements",
    b: "extends",
    c: "inherits",
    d: "super",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Can a Java class implement multiple interfaces?",
    a: "No, Java only supports single interface implementation",
    b: "Yes, a class can implement any number of interfaces",
    c: "Yes, but only up to 3",
    d: "Yes, but only if they contain no methods",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Can a Java class extend multiple parent classes directly?",
    a: "Yes, using multiple extends keywords",
    b: "No, Java does not support multiple inheritance for classes",
    c: "Yes, if separated by commas",
    d: "Yes, in Java 8 and above",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is the difference between method overloading and method overriding?",
    a: "Overloading is in the same class (different parameters), overriding is in a subclass (same signature)",
    b: "Overriding is in the same class, overloading is in a subclass",
    c: "There is no difference",
    d: "Overloading is for variables, overriding is for methods",
    correct: "A"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Which keyword prevents a class from being inherited or extended by another class?",
    a: "static",
    b: "abstract",
    c: "final",
    d: "private",
    correct: "C"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is a constructor in Java?",
    a: "A method that destroys objects to free memory",
    b: "A special method used to initialize new objects",
    c: "A keyword used to compile classes",
    d: "A tool for building user interfaces",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is the return type of a constructor in Java?",
    a: "void",
    b: "Object",
    c: "It has no return type, not even void",
    d: "int",
    correct: "C"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Which keyword is used to refer to the parent class's constructor or methods?",
    a: "this",
    b: "super",
    c: "parent",
    d: "base",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is encapsulation in OOP?",
    a: "Hiding internal data and restricting direct access by wrapping it with methods",
    b: "Inheriting methods from another class",
    c: "Creating multiple methods with the same name",
    d: "Converting code into byte code",
    correct: "A"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is polymorphism in OOP?",
    a: "The process of hiding implementation details",
    b: "The ability of a single object or method to take on multiple forms",
    c: "Restricting class inheritance",
    d: "Defining variables of different types",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is an abstract class in Java?",
    a: "A class that cannot be inherited",
    b: "A class that cannot be instantiated and may contain abstract methods",
    c: "A class with only static methods",
    d: "An interface",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Can an interface have concrete (implemented) methods in Java 8 and above?",
    a: "No, interfaces can only have abstract methods",
    b: "Yes, using default and static keywords",
    c: "Yes, but only private methods are allowed",
    d: "Yes, all methods in an interface can be concrete",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Which keyword is used when a class wants to conform to an interface?",
    a: "extends",
    b: "implements",
    c: "uses",
    d: "imports",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is the difference between a class and an object?",
    a: "An object is a blueprint, a class is an instance",
    b: "A class is a blueprint, an object is an instance of that class",
    c: "They are exactly the same thing",
    d: "A class is stored on the stack, an object on the heap",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Which access modifier is the most restrictive?",
    a: "public",
    b: "private",
    c: "protected",
    d: "default",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is a static variable in Java?",
    a: "A variable that changes its value dynamically",
    b: "A variable that belongs to the class itself, shared among all instances",
    c: "A variable that cannot be accessed by methods",
    d: "A constant",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "Can a static method access non-static variables of the same class directly?",
    a: "Yes, always",
    b: "No, it must access them through an object instance",
    c: "Yes, if the variables are marked final",
    d: "Yes, in Java 11 and above",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What constitutes a method signature in Java?",
    a: "Method name, return type, and parameters",
    b: "Method name and parameter types",
    c: "Method name and return type",
    d: "Access modifier and method name",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "intermediate",
    prompt: "What is the output: class Test { int x; } Test t = new Test(); System.out.print(t.x);?",
    a: "0",
    b: "null",
    c: "Compile-time error",
    d: "Undefined",
    correct: "A"
  },
  // --- ADVANCED (10) ---
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is a major difference between an abstract class and an interface in Java 8+?",
    a: "Interfaces can have constructors, abstract classes cannot",
    b: "Abstract classes can have instance fields and constructors, interfaces cannot",
    c: "Interfaces can extend multiple classes, abstract classes cannot",
    d: "There is no difference anymore",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is dynamic method dispatch in Java?",
    a: "Overloading methods at compile-time",
    b: "Resolving overridden method calls at runtime dynamically based on object type",
    c: "Calling static methods without an object",
    d: "Garbage collection of unused methods",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is the purpose of using the this() call inside a constructor?",
    a: "To call the parent class constructor",
    b: "To call another constructor within the same class",
    c: "To instantiate the class",
    d: "To refer to static variables",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "Can you override a static method in a subclass?",
    a: "Yes, always",
    b: "No, static methods are hidden (shadowed), not overridden",
    c: "Yes, if marked public",
    d: "Yes, in Java 17",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is constructor chaining in Java?",
    a: "Creating multiple constructors with the same parameters",
    b: "The process of calling a sequence of constructors upon object creation",
    c: "Calling constructors from a different class package",
    d: "Preventing constructor execution",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What relationship is represented by composition compared to inheritance?",
    a: "Composition is 'is-a', inheritance is 'has-a'",
    b: "Composition is 'has-a', inheritance is 'is-a'",
    c: "Both represent 'is-a' relationships",
    d: "Both represent 'has-a' relationships",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is a shadow variable in Java?",
    a: "A variable declared in a subclass with the same name as one in the superclass",
    b: "A local variable that has the same name as an instance variable in the same scope",
    c: "A variable that is hidden by the garbage collector",
    d: "Both A and B",
    correct: "D"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What happens when a subclass constructor does not explicitly call a superclass constructor?",
    a: "It results in a compile-time error",
    b: "The compiler automatically inserts an implicit super() call to the parent's no-arg constructor",
    c: "No parent constructor is executed",
    d: "The program throws a NullPointerException at runtime",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "Can an interface in Java declare instance variables?",
    a: "Yes, if they are marked private",
    b: "No, all fields in an interface are implicitly public static final (constants)",
    c: "Yes, in Java 9+",
    d: "Yes, if they are not initialized",
    correct: "B"
  },
  {
    module_id: 14,
    difficulty: "advanced",
    prompt: "What is the difference between a shallow copy and a deep copy of an object?",
    a: "Shallow copy copies references, deep copy creates new instances of nested objects",
    b: "Deep copy copies references, shallow copy creates new instances",
    c: "There is no difference",
    d: "Shallow copy is for primitives, deep copy is for objects",
    correct: "A"
  }
];

async function main() {
  console.log(`Starting seeding of ${questions.length} questions...`);
  try {
    for (const q of questions) {
      await db.query(
        "INSERT INTO questions(module_id, prompt, a, b, c, d, correct, difficulty) VALUES(?,?,?,?,?,?,?,?)",
        [q.module_id, q.prompt, q.a, q.b, q.c, q.d, q.correct, q.difficulty]
      );
    }
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

main();
