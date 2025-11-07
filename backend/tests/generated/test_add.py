def add(a,b):
    return a+b

import pytest

# Positive test case for addition function
def test_add():
    assert add(10, 5) == 15
    assert add(-1, 1) == 0
    assert add(0, 0) == 0

# Negative test case for addition function
def test_add_negative():
    assert add(10, -5) != 10
    assert add(-1, -10) != -9
    assert add(0, 1) != 1

# Edge test cases for addition function
def test_add_edge():
    # testing with big numbers
    assert add(1234567890, 9876543210) == 11111111100
    # testing negative numbers
    assert add(-10, -20) == -30
    # testing with zero
    assert add(0, 2**64) == 2**64
