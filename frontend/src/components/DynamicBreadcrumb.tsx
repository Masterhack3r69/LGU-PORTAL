import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export function DynamicBreadcrumb() {
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  // Handle single breadcrumb case (like Dashboard)
  if (breadcrumbs.length === 1) {
    const item = breadcrumbs[0];
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {item.current || !item.href ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.href}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // For mobile: show only the first and last breadcrumb with ellipsis if there are more than 2
  const shouldTruncate = breadcrumbs.length > 3;
  const firstItem = breadcrumbs[0];
  const lastItem = breadcrumbs[breadcrumbs.length - 1];
  const middleItems = breadcrumbs.slice(1, -1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* First item - always visible */}
        <BreadcrumbItem className="hidden md:block">
          {firstItem.current || !firstItem.href ? (
            <BreadcrumbPage>{firstItem.label}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={firstItem.href}>{firstItem.label}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {breadcrumbs.length > 1 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}

        {/* Middle items handling */}
        {shouldTruncate ? (
          <>
            {/* Show ellipsis dropdown for middle items on desktop */}
            <BreadcrumbItem className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middleItems.map((item, index) => (
                    <DropdownMenuItem key={index}>
                      {item.href ? (
                        <Link to={item.href} className="flex w-full">
                          {item.label}
                        </Link>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        ) : (
          /* Show all middle items on desktop when not truncating */
          middleItems.map((item, index) => (
            <div key={index} className="hidden md:flex items-center">
              <BreadcrumbItem>
                {item.current || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < middleItems.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))
        )}

        {/* Last item - current page */}
        {breadcrumbs.length > 1 && (
          <BreadcrumbItem>
            <BreadcrumbPage>{lastItem.label}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}