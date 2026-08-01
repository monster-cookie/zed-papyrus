ScriptName ZedPapyrus:InvalidSyntax extends Quest

Function MissingCloser(Int aiValue)
    If aiValue > 0
        Debug.Trace("This fixture intentionally omits EndIf")
EndFunction
