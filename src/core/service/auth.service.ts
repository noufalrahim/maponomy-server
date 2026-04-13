import { and, eq, or } from "drizzle-orm";
import { NewUser, SalesPersonRecord, salespersons, UserRecord, users, vendors } from "../../infrastructure/db/schema";
import { generateTokens, verifyToken } from "../../utils/jwt";
import { AuthDTO, AuthLoginDTO, LoginResponseDTO } from "../dto";
import { UserModel } from "../model/user.model";
import { BaseService } from "./base/base.service";
import bcryptjs from "bcryptjs";
import { SignupResponseDTO } from "../dto/ResponseDTO/SignupResponseDTO";
import { Role } from "../../types";
import { db } from "../../config/database";

export class AuthService extends BaseService<
  UserRecord,
  NewUser
> {
  protected readonly model = new UserModel();

  constructor() {
    super();
  }

async validateToken(
  token: string
): Promise<
  UserRecord & {
    salesperson: SalesPersonRecord | null
    customer: typeof vendors.$inferSelect | null
  }
> {
  const tokenPayload = verifyToken(token)

  const userRec = await db
    .select()
    .from(users)
    .where(eq(users.id, tokenPayload.id))
    .limit(1)

  if (userRec.length === 0) {
    throw new Error("User not found")
  }

  const role = userRec[0].role

  let result: any[]

  if (role === Role.SALES_PERSON) {
    result = await db
      .select({
        user: users,
        salesperson: salespersons,
      })
      .from(users)
      .leftJoin(
        salespersons,
        eq(salespersons.userId, users.id)
      )
      .where(eq(users.id, tokenPayload.id))
      .limit(1)
  } else if (role === Role.CUSTOMER) {
    result = await db
      .select({
        user: users,
        customer: vendors,
      })
      .from(users)
      .leftJoin(
        vendors,
        eq(vendors.userId, users.id)
      )
      .where(eq(users.id, tokenPayload.id))
      .limit(1)
  } else if(role === Role.ADMIN || role === Role.WAREHOUSE_MANAGER) {
    result = await db
      .select({
        user: users,
      })
      .from(users)
      .where(eq(users.id, tokenPayload.id))
      .limit(1)
  } else {
    throw new Error("INVALID_PERMISSION")
  }

  if (result.length === 0) {
    throw new Error("User not found")
  }

  const row = result[0]

  return {
    ...row.user,
    salesperson: role === Role.SALES_PERSON ? row.salesperson ?? null : null,
    customer: role === Role.CUSTOMER ? row.customer ?? null : null,
  }
}


  async login(user: AuthLoginDTO): Promise<LoginResponseDTO> {
    const userRec = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, user.email),
          or(
            eq(users.role, Role.SALES_PERSON),
            eq(users.role, Role.CUSTOMER)
          )
        )
      )
      .limit(1)

    if (userRec.length === 0) {
      throw new Error("User not found")
    }

    const role = userRec[0].role as Role

    let result: any[]

    if (role === Role.SALES_PERSON) {
      result = await db
        .select({
          user: users,
          salesperson: salespersons,
        })
        .from(users)
        .leftJoin(
          salespersons,
          eq(salespersons.userId, users.id)
        )
        .where(eq(users.email, user.email))
        .limit(1)
    } else {
      result = await db
        .select({
          user: users,
          vendor: vendors,
        })
        .from(users)
        .leftJoin(
          vendors,
          eq(vendors.userId, users.id)
        )
        .where(eq(users.email, user.email))
        .limit(1)
    }

    if (result.length === 0) {
      throw new Error("User not found")
    }

    const row = result[0]
    const userRecord = row.user
    const isPasswordValid = await bcryptjs.compare(
      user.password.trim(),
      userRecord.password.trim()
    )

    if (!isPasswordValid) {
      throw new Error("Invalid password")
    }

    const { password, ...safeUser } = userRecord

    const { accessToken } = generateTokens({
      id: safeUser.id,
      type: role === Role.SALES_PERSON ? Role.SALES_PERSON : Role.CUSTOMER,
    })

    return {
      ...safeUser,
      salesperson: role === Role.SALES_PERSON ? row.salesperson ?? null : null,
      vendor: role === Role.CUSTOMER ? row.vendor ?? null : null,
      token: accessToken,
    }
  }


  async registerUser(user: AuthDTO): Promise<SignupResponseDTO> {
    const existingUser = await this.model.find({
      where: and(eq(users.email, user.email), eq(users.role, user.role)),
      limit: 1,
    });

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }
    const hashedPassword = await bcryptjs.hash(user.password.trim(), 10);

    const userRecord = await this.model.create({
      ...user,
      password: hashedPassword,
      role: user.role,
    });

    const { accessToken } = generateTokens({
      id: userRecord.id!,
      type: user.role,
    });

    return {
      user: {
        ...userRecord,
        token: accessToken
      },
    };
  }

  async resetPassword(userId: string, password: string) {
    const user = await this.model.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcryptjs.hash(password.trim(), 10);

    return this.model.updateById(userId, {
      password: hashedPassword,
    });
  }

  async adminLogin(user: AuthLoginDTO): Promise<LoginResponseDTO> {

    console.log("User: ", user);

    const result = await this.model.find({
      where: and(
        eq(users.email, user.email), 
        or(eq(users.role, Role.ADMIN), eq(users.role, Role.WAREHOUSE_MANAGER))
      ),
      limit: 1,
    });

    console.log("Result: ", result);

    if (result.length === 0 || (result[0].role !== Role.ADMIN && result[0].role !== Role.WAREHOUSE_MANAGER)) {
      throw new Error("User not found");
    }

    const userRecord = result[0];

    const isPasswordValid = await bcryptjs.compare(
      user.password,
      userRecord.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const { password, ...safeUser } = userRecord;

    const { accessToken } = generateTokens({
      id: safeUser.id,
      type: userRecord.role as Role,
      warehouseId: userRecord.warehouseId,
    });

    return {
      ...safeUser,
      token: accessToken,
    };
  }
}
