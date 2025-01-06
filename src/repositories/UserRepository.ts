import { prisma } from "../db/prisma";

export class UserRepository {
  static async registerUser(body: any) {
    const {
      name,
      email,
      password_hash,
      city,
      phone,
      cpf,
    } = body;

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      throw { name: "DBerror", message: "User already exists." };
    }

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          city,
          cpf,
          phone,
        },
      });

      return user;
    } catch (error) {
      throw { name: "DBerror", message: "User not created." };
    }
  }

  static async FindUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (e) {
      throw { name: "DBerror", message: "User not found." };
    }
  }

  // Método para encontrar usuário por ID
  static async FindUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (e) {
      throw { name: "DBerror", message: "User not found." };
    }
  }

  static async UpdateUser(id: string, data: any) {
    try {
      return await prisma.user.update({
        where: { id },
        data: data,
      });
    } catch (e) {
      throw { name: "DBerror", message: "User not updated." };
    }
  }
}
