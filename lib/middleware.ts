import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "./roles";

export function authorize(
  req: NextRequest,
  allowedRoles: Role[]
) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Missing authorization token" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      orgId: string;
      role: Role;
    };

    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    return decoded; // ✅ return user context
  } catch {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
