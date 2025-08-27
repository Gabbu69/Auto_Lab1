# DFA 2 (alphabet {a,b})

def dfa2(word):
    state = 0   # start at q0
    for ch in word:
        if state == 0:  # q0
            if ch == "a":
                state = 1
            elif ch == "b":
                state = 2
        elif state == 1:  # q1
            if ch == "a":
                state = 0
            elif ch == "b":
                state = 3
        elif state == 2:  # q2
            if ch == "a":
                state = 3
            elif ch == "b":
                state = 0
        elif state == 3:  # q3
            if ch == "a":
                state = 2
            elif ch == "b":
                state = 1
    if state == 0 or state == 3:
        return True
    else:
        return False


# MAIN PROGRAM
while True:
    print("\n--- DFA 2 SIMULATOR ---")
    s = input("Enter string of a and b (or type exit): ")

    if s.lower() == "exit":
        print("Program ended.")
        break

    if dfa2(s):
        print("ACCEPTED by DFA 2")
    else:
        print("REJECTED by DFA 2")