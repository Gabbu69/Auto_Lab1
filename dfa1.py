# DFA 1 (alphabet {0,1})

def dfa1(word):
    state = 0   # start at a
    for ch in word:
        if state == 0:  # a
            if ch == "0":
                state = 0
            elif ch == "1":
                state = 1
        elif state == 1:  # b
            if ch == "0":
                state = 2
            elif ch == "1":
                state = 0
        elif state == 2:  # c (final)
            state = 2     # loop back to c
    if state == 2:
        return True
    else:
        return False


# MAIN PROGRAM
while True:
    print("\n--- DFA 1 SIMULATOR ---")
    s = input("Enter string of 0 and 1 (or type exit): ")

    if s.lower() == "exit":
        print("Program ended.")
        break

    if dfa1(s):
        print("ACCEPTED by DFA 1")
    else:
        print("REJECTED by DFA 1")
