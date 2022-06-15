# Roqueform [![build](https://github.com/smikhalevski/roqueform/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/roqueform/actions/workflows/master.yml)

# Motivation

Form lifecycle consists of four separate phases: Input, Validate, Display Errors, and Submit. These phases can be
represented as non-intersecting black boxes. The result obtained during one phase may be used as an input for another
phase:

1. The input value is validated.
2. Validation errors are displayed.
3. Input value is submitted.
4. Validation errors received after a backend validation are displayed.

Since phases are non-intersecting, they should only share the knowledge about data shapes passed between them. This also
allows phases to be run in parallel. The couple of examples:

1. While user proceeds with input, we can asynchronously validate the input and show errors for fields that were not
   updated while validation was pending.
2. We can debounce computation-heavy asynchronous validation or abort it if the input has changed.

The form management solution must be agnostic to validation process, shouldn’t enforce the way errors are displayed, or
restrict how the data submission is handled.

Since data submission is application-specific, and there’s a great number of awesome validation libraries, we should
focus on streamlining the form input management and error display.
