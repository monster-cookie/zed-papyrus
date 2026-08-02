ScriptName ZedPapyrusInvalidSkyrim extends Quest

State MissingStateCloser
    Event OnBeginState()
        Debug.Trace("This fixture intentionally omits EndState")
    EndEvent
