import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Building, Calendar, MapPin, Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { degrees, specializations, semesters } from '@/data/mockData';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const steps = [
  { id: 'degree', title: 'Your Degree', icon: GraduationCap },
  { id: 'university', title: 'University', icon: Building },
  { id: 'semester', title: 'Semester', icon: Calendar },
  { id: 'preferences', title: 'Preferences', icon: Globe },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    degree: '',
    specialization: '',
    university: '',
    college: '',
    semester: '',
    location: '',
    preferredLanguage: 'en' as 'en' | 'hi',
  });
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  // Fetch Universities
  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data } = await api.get('/universities');
      return data.data;
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      // GOD-LEVEL FIX: Map Frontend Form to Backend Schema
      // 1. Find University ID
      const selectedUni = universities.find((u: any) => u.name === formData.university);
      const universityId = selectedUni?.id;

      // 2. Combine Degree & Specialization (Since DB lacks specialization column)
      const fullDegree = formData.specialization
        ? `${formData.degree} - ${formData.specialization}`
        : formData.degree;

      completeOnboarding({
        degree: fullDegree,
        universityId: universityId, // Send UUID
        university: formData.university, // optimistic update for UI
        collegeName: formData.college, // Map to snake_case equivalent prop
        currentSemester: parseInt(formData.semester), // Map to snake_case equivalent prop
        location: formData.location,
        preferredLanguage: formData.preferredLanguage,
      });
      toast.success('Profile setup complete!');
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.degree && formData.specialization;
      case 1:
        return formData.university;
      case 2:
        return formData.semester;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-24 h-1 mx-2 rounded transition-all duration-300 ${index < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
          {/* Step 1: Degree */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <GraduationCap className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-display text-2xl font-bold">What are you studying?</h3>
                <p className="text-muted-foreground mt-2">
                  This helps us show you relevant notes
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select
                    value={formData.degree}
                    onValueChange={(value) =>
                      setFormData({ ...formData, degree: value, specialization: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((degree) => (
                        <SelectItem key={degree} value={degree}>
                          {degree}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.degree && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) =>
                        setFormData({ ...formData, specialization: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations[formData.degree]?.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: University */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <Building className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-display text-2xl font-bold">Your University</h3>
                <p className="text-muted-foreground mt-2">
                  Find notes from your college seniors
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select
                    value={formData.university}
                    onValueChange={(value) =>
                      setFormData({ ...formData, university: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni: any) => (
                        <SelectItem key={uni.id} value={uni.name}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.university && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>College Name (Optional)</Label>
                    <Input
                      placeholder="Enter your college name"
                      value={formData.college}
                      onChange={(e) =>
                        setFormData({ ...formData, college: e.target.value })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Since we don't track all colleges, type yours manually.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Semester */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-display text-2xl font-bold">Current Semester</h3>
                <p className="text-muted-foreground mt-2">
                  We'll prioritize notes for your current semester
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() =>
                      setFormData({ ...formData, semester: sem.toString() })
                    }
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${formData.semester === sem.toString()
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold">{sem}</div>
                    <div className="text-xs text-muted-foreground truncate">Sem</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <Globe className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-display text-2xl font-bold">Preferences</h3>
                <p className="text-muted-foreground mt-2">
                  Customize your experience
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setFormData({ ...formData, preferredLanguage: 'en' })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.preferredLanguage === 'en'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="text-lg font-semibold">English</div>
                    </button>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, preferredLanguage: 'hi' })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.preferredLanguage === 'hi'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="text-lg font-semibold">हिंदी</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location (Optional)</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raipur">Raipur</SelectItem>
                      <SelectItem value="bhilai">Bhilai</SelectItem>
                      <SelectItem value="bilaspur">Bilaspur</SelectItem>
                      <SelectItem value="durg">Durg</SelectItem>
                      <SelectItem value="korba">Korba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {currentStep > 0 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div /> // GOD-LEVEL: No Skip Allowed (Mandatory Onboarding)
              )}
            </div>
            <Button onClick={handleNext} disabled={!canProceed()}>
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
