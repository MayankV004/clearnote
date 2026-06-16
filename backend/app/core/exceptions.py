class DoctorNotFoundException(Exception):
    def __init__(self, message: str = "Doctor not found"):
        self.message = message
        super().__init__(self.message)

class DoctorAlreadyOnboardedException(Exception):
    def __init__(self, message: str = "Doctor already onboarded"):
        self.message = message
        super().__init__(self.message)

class PatientNotFoundException(Exception):
    def __init__(self, message: str = "Patient not found"):
        self.message = message
        super().__init__(self.message)

class ConsultationNotFoundException(Exception):
    def __init__(self, message: str = "Consultation not found"):
        self.message = message
        super().__init__(self.message)

class PatientNotOwnedException(Exception):
    def __init__(self, message: str = "Patient does not belong to this doctor"):
        self.message = message
        super().__init__(self.message)
