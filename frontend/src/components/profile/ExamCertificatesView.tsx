import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Calendar, MapPin, Hash, CheckCircle } from 'lucide-react';
import { examCertificateService } from '@/services/examCertificateService';
import type { ExamCertificate } from '@/types/employee';

interface ExamCertificatesViewProps {
  employeeId: number;
}

export function ExamCertificatesView({ employeeId }: ExamCertificatesViewProps) {
  const [certificates, setCertificates] = useState<ExamCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        const certs = await examCertificateService.getExamCertificatesByEmployee(employeeId);
        setCertificates(certs || []);
      } catch (error) {
        console.error('Failed to fetch exam certificates:', error);
        setCertificates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [employeeId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Exam Certificates
          </CardTitle>
          <CardDescription>Your examination records and certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading certificates...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Exam Certificates
          </CardTitle>
          <CardDescription>Your examination records and certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No exam certificates on record</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Exam Certificates
            </CardTitle>
            <CardDescription>
              Your examination records and certifications
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">{certificates.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {certificates.map((cert, index) => (
            <div
              key={cert.id || index}
              className="group relative border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
            >
              {/* Header with Icon and Title */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                    {cert.exam_name}
                  </h4>
                  {cert.exam_type && (
                    <p className="text-sm text-muted-foreground">{cert.exam_type}</p>
                  )}
                </div>
                {cert.rating && (
                  <div className="flex-shrink-0 px-2.5 py-1 bg-primary/10 rounded-lg">
                    <span className="text-sm font-bold text-primary">{cert.rating}%</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                {cert.date_taken && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {new Date(cert.date_taken).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {cert.place_of_examination && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{cert.place_of_examination}</span>
                  </div>
                )}

                {cert.license_number && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <span className="font-mono text-xs">{cert.license_number}</span>
                  </div>
                )}

                {cert.validity_date && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Valid date</span>
                      <span className="font-medium text-foreground">
                        {new Date(cert.validity_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
