import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Redirect, Route as WouterRoute, Router, Switch, Link, useLocation as useWouterLocation, useParams, useSearch, useSearchParams } from "wouter";

export const BrowserRouter = Router;
export { Link, useParams, useSearchParams };

type RouteProps = { path?: string; element: ReactNode };

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  return (
    <Switch>
      {Children.toArray(children).map((child) => {
        if (!isValidElement<RouteProps>(child)) return child;
        return child.props.path === "*"
          ? <WouterRoute key={child.key}>{child.props.element}</WouterRoute>
          : <WouterRoute key={child.key} path={child.props.path}>{child.props.element}</WouterRoute>;
      }) as ReactElement[]}
    </Switch>
  );
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  return <Redirect to={to} replace={replace} />;
}

export function useNavigate() {
  const [, navigate] = useWouterLocation();
  return (to: string, options?: { replace?: boolean; state?: unknown }) => navigate(to, options);
}

export function useLocation() {
  const [pathname] = useWouterLocation();
  const search = useSearch();
  return { pathname, search: search ? `?${search}` : "", state: window.history.state };
}
