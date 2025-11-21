def add(a, b):
    print(f"add {a} and {b}")
    return a+b

import pytest
from pytest import mark

@mark.happy_path
def test_add_positive():
    assert add(2, 3) == 5

@mark.happy_path
def test_add_negative():
    assert add(-1, -2) == -3

@mark.edge_cases
def test_add_max_integers():
    max_int = 2**63 - 1
    assert add(max_int, 1) == (2**63)

@mark.edge_cases
def test_add_min_integers():
    min_int = -(2**63)
    assert add(min_int, -1) == -(2**64)

@mark.edge_cases
def test_add_max_and_min_integers():
    max_int = 2**63 - 1
    min_int = -(2**63)
    assert add(max_int, min_int) == (-(2**63 + (2**63 - 1)))

@mark.happy_path
def test_add_zeroes():
    assert add(0, 0) == 0

@mark.edge_cases
def test_add_floats():
    assert abs(add(1.5, 2.5) - 4.0) < 0.0001
